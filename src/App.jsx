import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import ReactDOM from "react-dom"
import { loadData, saveData, deleteData, loadAllLeagues, saveAllLeagues, saveLeague, loadUserProfile, saveUserProfile, loadAllUserProfiles, deleteUserProfile, deleteAuthAccount, onAuthChange, signUp, signIn, signInWithGoogle, signOut, resetPassword, ADMIN_EMAIL } from "./firebase.js"
import * as XLSX from "xlsx"
import { calcContestantWeekPoints, calcTeamWeekPoints, calcStandings } from "./scoring.js"


const IMPORTED_LEAGUES = [];





// ─── Data Layer ───
const DEFAULT_SCORING_RULES = [
  // ─── Survivor (from your live league) ───
  // v2.4.46.0: `description` field added to disambiguate shorthand rule names —
  // testers playing the live Survivor league were confused about what several
  // rules actually counted. Descriptions are displayed in the Scoring tab (event
  // list + assign view) and in the library picker / rule editor.
  { id: "loses_vote_due_to_risk", label: "Loses Vote Due to Risk", points: -2, category: "Strategy/Social",
    description: "Drew 'not safe' from Shot in the Dark (or equivalent risk mechanic) — their vote at that tribal didn't count." },
  { id: "volunteers_for_journey___risk", label: "Volunteers for Journey / Risk", points: 1, category: "Strategy/Social",
    description: "Took the Journey opportunity (risked losing vote / belongings for a chance at an advantage)." },
  { id: "gains_advantage___idol", label: "Gains Advantage / Idol", points: 2, category: "Strategy/Social",
    description: "Won or earned any advantage or idol from a journey, on-island game, or host gift — distinct from finding a hidden idol on the beach." },
  { id: "finds_hidden_immunity_idol", label: "Finds Hidden Immunity Idol", points: 3, category: "Strategy/Social",
    description: "Found a hidden immunity idol while searching on the beach (not given by host, not won at a journey)." },
  { id: "successfully_splits_vote", label: "Successfully Splits Vote", points: 3, category: "Strategy/Social",
    description: "Was in on a vote-split plan and the plan worked (intended target was eliminated). All co-conspirators score." },
  { id: "uses_extra_vote_successfully", label: "Uses Extra Vote Successfully", points: 3, category: "Strategy/Social",
    description: "Played an extra vote at tribal and the intended target was eliminated." },
  { id: "steals_vote_successfully", label: "Steals Vote Successfully", points: 4, category: "Strategy/Social",
    description: "Played a steal-a-vote at tribal and the intended target was eliminated." },
  { id: "successfully_executes_blindside", label: "Successfully Executes Blindside", points: 5, category: "Strategy/Social",
    description: "Voted with a majority that eliminated a target who held an unplayed idol or didn't see it coming. All blindsiders score." },
  { id: "1st_to_make_fire_for_their_tribe", label: "1st To Make Fire for Their Tribe", points: 5, category: "Strategy/Social",
    description: "First person on their tribe to start fire from flint or friction. One-time award per tribe, per season." },
  { id: "wins_shot_in_the_dark", label: "Wins Shot in the Dark", points: 20, category: "Strategy/Social",
    description: "Drew 'safe' from Shot in the Dark — voids any votes against them at that tribal council." },
  { id: "blamed_for_team_loss", label: "Blamed for Team Loss", points: -2, category: "Challenge Performance",
    description: "The episode framed this contestant as the reason their tribe lost the challenge (drops the puzzle, falls off the beam, etc.)." },
  { id: "last_place_team_immunity", label: "Last Place Team Immunity", points: -1, category: "Challenge Performance",
    description: "Their tribe finished last in the immunity challenge." },
  { id: "last_place_team_reward", label: "Last Place Team Reward", points: -0.5, category: "Challenge Performance",
    description: "Their tribe finished last in the reward challenge." },
  { id: "first_place_team_reward", label: "First Place Team Reward", points: 0.5, category: "Challenge Performance",
    description: "Their tribe finished first in the reward challenge." },
  { id: "first_place_team_immunity", label: "First Place Team Immunity", points: 1, category: "Challenge Performance",
    description: "Their tribe finished first in the immunity challenge." },
  { id: "picked_to_go_with_winner_of_individual_reward", label: "Picked to Go with Reward Winner", points: 0.5, category: "Challenge Performance",
    description: "The individual reward winner chose this contestant to accompany them (not picked by host or random)." },
  { id: "wins_individual_reward", label: "Wins Individual Reward", points: 2, category: "Challenge Performance",
    description: "Won an individual reward challenge (post-merge)." },
  { id: "wins_individual_immunity", label: "Wins Individual Immunity", points: 4, category: "Challenge Performance",
    description: "Won an individual immunity challenge (post-merge)." },
  { id: "eliminated_with_idol_advantage", label: "Eliminated with Idol/Advantage", points: -15, category: "Tribal", isElimination: true,
    description: "Voted out at tribal while holding at least one unplayed idol or advantage." },
  { id: "sv_eliminated", label: "Eliminated", points: -10, category: "Tribal", isElimination: true,
    description: "Voted out at tribal council. Applies once per contestant, in the episode they are eliminated." },
  { id: "plays_hidden_immunity_idol_incorrectly", label: "Plays Idol Incorrectly", points: -3, category: "Tribal",
    description: "Played a hidden immunity idol at tribal but received zero votes (idol was wasted)." },
  { id: "receives_a_vote", label: "Receives a Vote", points: -1, category: "Tribal",
    description: "Received any vote against them at tribal council. Score per individual vote — three votes = three units of this rule." },
  { id: "receives_zero_votes_at_tribal", label: "Receives Zero Votes at Tribal", points: 2, category: "Tribal",
    description: "Attended a tribal council and received no votes against them." },
  { id: "correct_vote", label: "Correct Vote", points: 3, category: "Tribal",
    description: "Cast a vote for the contestant who was eliminated at that tribal (voted with the successful majority)." },
  { id: "saved_by_advantage", label: "Saved by Advantage", points: 3, category: "Tribal",
    description: "Avoided elimination because someone played an advantage that protected them (shield, immunity gift, etc.)." },
  { id: "plays_hidden_immunity_idol_successfully", label: "Plays Idol Successfully", points: 6, category: "Tribal",
    description: "Played a hidden immunity idol at tribal and received at least one vote that would have counted against them." },
  { id: "1st_member_of_the_jury", label: "1st Member of the Jury", points: 5, category: "Endgame",
    description: "First eliminated juror (the bridge eliminee that makes the jury for that season)." },
  { id: "wins_final_4_fire_making_challenge", label: "Wins Fire-Making Challenge", points: 5, category: "Endgame",
    description: "Won the Final 4 fire-making challenge to advance to Final 3." },
  { id: "final_5", label: "Final 5", points: 10, category: "Endgame",
    description: "Outlasted the field to be one of the last five contestants standing." },
  { id: "final_4", label: "Final 4", points: 15, category: "Endgame",
    description: "Outlasted the field to be one of the last four contestants standing." },
  { id: "sv_winner", label: "Winner of the Show", points: 50, category: "Endgame",
    description: "Received the majority of jury votes at Final Tribal Council — Sole Survivor." },

  // ─── Top Chef (from your live league) ───
  { id: "money_earned_per_1k", label: "Money Earned (per $1K)", points: 0.2, category: "Competition" },
  { id: "favorite_dish_in_quickfire", label: "Favorite Dish in QuickFire", points: 1, category: "Competition" },
  { id: "favorite_dish_in_elimination", label: "Favorite Dish in Elimination", points: 2, category: "Competition" },
  { id: "win_quickfire", label: "Win QuickFire", points: 2, category: "Competition" },
  { id: "win_elimination", label: "Win Elimination", points: 3, category: "Competition" },
  { id: "win_restaurant_wars", label: "Win Restaurant Wars", points: 20, category: "Competition" },
  { id: "return_from_last_chance_kitchen", label: "Return from Last Chance Kitchen", points: 25, category: "Competition" },
  { id: "tc_final_3", label: "Final 3", points: 25, category: "Competition" },
  { id: "tc_winner", label: "Winner of the Show", points: 25, category: "Competition" },
  { id: "least_favorite_dish_in_quickfire", label: "Least Favorite Dish in QuickFire", points: -1, category: "Competition" },
  { id: "least_favorite_dish_in_elimination", label: "Least Favorite Dish in Elimination", points: -2, category: "Competition" },
  { id: "cuts_self", label: "Cuts Self", points: -1, category: "Competition" },
  { id: "fails_to_get_all_components_on_plate", label: "Fails to Get All Components on Plate", points: -1, category: "Competition" },
  { id: "entirely_empty_plate", label: "Entirely Empty Plate", points: -2, category: "Competition" },
  { id: "tc_eliminated", label: "Eliminated", points: -8, category: "Competition" },

  // ─── Love Island ───
  { id: "li_coupled", label: "Coupled Up", points: 5, category: "Social" },
  { id: "li_dumped", label: "Dumped from Island", points: -5, category: "Survival" },
  { id: "li_recoupled", label: "Switched Partners", points: 3, category: "Social" },
  { id: "li_got_text", label: "Got a Text", points: 2, category: "Moments" },
  { id: "li_date", label: "Went on a Date", points: 3, category: "Social" },
  { id: "li_casa_loyal", label: "Stayed Loyal (Casa Amor)", points: 8, category: "Social" },
  { id: "li_casa_switched", label: "Switched (Casa Amor)", points: -3, category: "Social" },
  { id: "li_public_vote_saved", label: "Saved by Public Vote", points: 5, category: "Survival" },
  { id: "li_public_vote_bottom", label: "Bottom of Public Vote", points: -3, category: "Survival" },
  { id: "li_challenge_win", label: "Won a Challenge", points: 5, category: "Competition" },
  { id: "li_final_couple", label: "Made Final Couples", points: 15, category: "Endgame" },
  { id: "li_winner", label: "Won Love Island", points: 25, category: "Endgame" },
  { id: "li_crying", label: "Cried on Camera", points: 1, category: "Moments" },

  // ─── Bachelor/ette ───
  { id: "ba_rose", label: "Received a Rose", points: 5, category: "Survival" },
  { id: "ba_no_rose", label: "Sent Home (No Rose)", points: -8, category: "Survival" },
  { id: "ba_first_impression", label: "Got First Impression Rose", points: 10, category: "Moments" },
  { id: "ba_one_on_one", label: "Got One-on-One Date", points: 5, category: "Dates" },
  { id: "ba_group_date_rose", label: "Got Group Date Rose", points: 3, category: "Dates" },
  { id: "ba_two_on_one", label: "Survived Two-on-One", points: 5, category: "Survival" },
  { id: "ba_kiss", label: "Kissed the Lead", points: 2, category: "Moments" },
  { id: "ba_self_elim", label: "Self-Eliminated", points: -3, category: "Survival" },
  { id: "ba_crying", label: "Cried on Camera", points: 1, category: "Moments" },
  { id: "ba_limo_exit_drama", label: "Dramatic Limo Exit", points: 2, category: "Moments" },
  { id: "ba_hometown", label: "Got Hometown Date", points: 8, category: "Dates" },
  { id: "ba_fantasy_suite", label: "Got Fantasy Suite Date", points: 10, category: "Dates" },
  { id: "ba_final_rose", label: "Got Final Rose", points: 25, category: "Endgame" },
  { id: "ba_engaged", label: "Got Engaged", points: 30, category: "Endgame" },

  // ─── Bake Off ───
  { id: "bo_star_baker", label: "Star Baker", points: 15, category: "Competition" },
  { id: "bo_technical_1st", label: "1st in Technical", points: 10, category: "Competition" },
  { id: "bo_technical_top3", label: "Top 3 in Technical", points: 5, category: "Competition" },
  { id: "bo_technical_bottom3", label: "Bottom 3 in Technical", points: -3, category: "Competition" },
  { id: "bo_technical_last", label: "Last in Technical", points: -5, category: "Competition" },
  { id: "bo_hollywood", label: "Got Hollywood Handshake", points: 12, category: "Moments" },
  { id: "bo_raw_soggy", label: "Raw/Soggy/Underbaked", points: -3, category: "Moments" },
  { id: "bo_praised", label: "Dish Praised by Judges", points: 3, category: "Competition" },
  { id: "bo_criticized", label: "Dish Criticized by Judges", points: -2, category: "Competition" },
  { id: "bo_eliminated", label: "Eliminated", points: -8, category: "Survival" },
  { id: "bo_final", label: "Made the Final", points: 15, category: "Endgame" },
  { id: "bo_winner", label: "Won Bake Off", points: 30, category: "Endgame" },

  // ─── The Traitors ───
  { id: "tr_murdered", label: "Murdered (by Traitors)", points: -8, category: "Survival" },
  { id: "tr_banished", label: "Banished (voted out)", points: -8, category: "Survival" },
  { id: "tr_banished_traitor", label: "Correctly Banished a Traitor", points: 15, category: "Strategy" },
  { id: "tr_banished_faithful", label: "Voted to Banish a Faithful", points: -3, category: "Strategy" },
  { id: "tr_won_shield", label: "Won Shield in Mission", points: 10, category: "Competition" },
  { id: "tr_recruited", label: "Recruited as Traitor", points: 5, category: "Strategy" },
  { id: "tr_survived_roundtable", label: "Survived Roundtable", points: 3, category: "Survival" },
  { id: "tr_mission_money", label: "Added Money to Prize Pot", points: 2, category: "Competition" },
  { id: "tr_accused", label: "Accused at Roundtable", points: -1, category: "Social" },
  { id: "tr_traitor_survived", label: "Survived as Traitor", points: 5, category: "Strategy" },
  { id: "tr_final", label: "Made the Final", points: 10, category: "Endgame" },
  { id: "tr_winner", label: "Won (Faithful in Final)", points: 25, category: "Endgame" },

  // ─── Big Brother ───
  { id: "bb_won_hoh", label: "Won HoH", points: 15, category: "Competition" },
  { id: "bb_won_veto", label: "Won Veto", points: 10, category: "Competition" },
  { id: "bb_nominated", label: "Nominated", points: -3, category: "Survival" },
  { id: "bb_used_veto_on_self", label: "Used Veto on Self", points: 8, category: "Strategy" },
  { id: "bb_veto_used_on_them", label: "Someone Else Used Veto on Them", points: 5, category: "Strategy" },
  { id: "bb_backdoored", label: "Backdoored", points: -5, category: "Survival" },
  { id: "bb_survived_block", label: "Survived the Block", points: 5, category: "Survival" },
  { id: "bb_evicted", label: "Evicted", points: -10, category: "Survival" },
  { id: "bb_have_not", label: "Became Have-Not", points: -1, category: "Moments" },
  { id: "bb_won_luxury", label: "Won Luxury Comp", points: 3, category: "Competition" },
  { id: "bb_unanimous_vote", label: "Stayed by Unanimous Vote", points: 5, category: "Survival" },
  { id: "bb_final_2", label: "Made Final 2", points: 15, category: "Endgame" },
  { id: "bb_winner", label: "Won Big Brother", points: 30, category: "Endgame" },

  // ─── The Challenge ───
  { id: "ch_daily_win", label: "Won Daily Challenge", points: 10, category: "Competition" },
  { id: "ch_elim_win", label: "Won Elimination Round", points: 12, category: "Competition" },
  { id: "ch_sent_in", label: "Sent into Elimination", points: -2, category: "Survival" },
  { id: "ch_purged", label: "Purged/DQ'd", points: -8, category: "Survival" },
  { id: "ch_skull", label: "Earned Skull/Ticket to Final", points: 8, category: "Competition" },
  { id: "ch_eliminated", label: "Eliminated in Elimination Round", points: -10, category: "Survival" },
  { id: "ch_last_place_daily", label: "Last Place in Daily", points: -2, category: "Competition" },
  { id: "ch_power_position", label: "Won Power/Deliberation Control", points: 5, category: "Strategy" },
  { id: "ch_called_out", label: "Called Out for Elimination", points: -1, category: "Social" },
  { id: "ch_final", label: "Made the Final", points: 15, category: "Endgame" },
  { id: "ch_winner", label: "Won the Final", points: 30, category: "Endgame" },

  // ─── Amazing Race ───
  { id: "ar_leg_first", label: "Finished Leg in 1st", points: 15, category: "Competition" },
  { id: "ar_leg_2nd", label: "Finished Leg in 2nd", points: 8, category: "Competition" },
  { id: "ar_leg_3rd", label: "Finished Leg in 3rd", points: 5, category: "Competition" },
  { id: "ar_leg_last", label: "Finished Leg Last", points: -3, category: "Competition" },
  { id: "ar_eliminated", label: "Eliminated", points: -10, category: "Survival" },
  { id: "ar_non_elim", label: "Saved by Non-Elimination Leg", points: 2, category: "Survival" },
  { id: "ar_detour_first", label: "First to Finish Detour", points: 5, category: "Competition" },
  { id: "ar_roadblock_complete", label: "Completed Roadblock", points: 3, category: "Competition" },
  { id: "ar_uturn", label: "U-Turned", points: -3, category: "Strategy" },
  { id: "ar_speed_bump", label: "Completed Speed Bump", points: -1, category: "Survival" },
  { id: "ar_express_pass", label: "Used Express Pass", points: 2, category: "Strategy" },
  { id: "ar_won_prize", label: "Won Leg Prize (trip/money)", points: 5, category: "Competition" },
  { id: "ar_final", label: "Made the Final Leg", points: 15, category: "Endgame" },
  { id: "ar_winner", label: "Won the Race", points: 30, category: "Endgame" },

  // ─── Love is Blind ───
  { id: "lb_pod_date", label: "Had Pod Date", points: 2, category: "Social" },
  { id: "lb_engaged", label: "Got Engaged in Pods", points: 10, category: "Moments" },
  { id: "lb_met_irl", label: "Reveal (First Met in Person)", points: 5, category: "Moments" },
  { id: "lb_argument", label: "Had On-Camera Argument", points: -2, category: "Social" },
  { id: "lb_broke_up", label: "Broke Up Before Wedding", points: -5, category: "Social" },
  { id: "lb_said_yes", label: "Said Yes at Altar", points: 15, category: "Endgame" },
  { id: "lb_said_no", label: "Said No at Altar", points: 5, category: "Endgame" },
  { id: "lb_still_together", label: "Still Together at Reunion", points: 10, category: "Endgame" },
  { id: "lb_crying", label: "Cried on Camera", points: 1, category: "Moments" },

  // ─── Drag Race ───
  { id: "dr_won_maxi", label: "Won Maxi Challenge", points: 15, category: "Competition" },
  { id: "dr_won_mini", label: "Won Mini Challenge", points: 5, category: "Competition" },
  { id: "dr_top2", label: "Top 2 / High", points: 5, category: "Competition" },
  { id: "dr_safe", label: "Safe", points: 1, category: "Survival" },
  { id: "dr_low", label: "Low", points: -2, category: "Survival" },
  { id: "dr_bottom2", label: "Bottom 2 / Lip Sync", points: -5, category: "Survival" },
  { id: "dr_shantay", label: "Shantay You Stay", points: 5, category: "Survival" },
  { id: "dr_sashay", label: "Sashay Away", points: -10, category: "Survival" },
  { id: "dr_runway_praised", label: "Runway Praised", points: 3, category: "Moments" },
  { id: "dr_snatch_game_win", label: "Won Snatch Game", points: 10, category: "Competition" },
  { id: "dr_final", label: "Made the Final", points: 15, category: "Endgame" },
  { id: "dr_winner", label: "Won Drag Race", points: 30, category: "Endgame" },

  // ─── Universal / Custom ───
  { id: "eliminated", label: "Eliminated", points: -5, category: "Survival" },
  { id: "survived", label: "Survived Episode", points: 3, category: "Survival" },
  { id: "won_episode", label: "Won Episode/Challenge", points: 10, category: "Competition" },
  { id: "crying", label: "Cried on Camera", points: 1, category: "Moments" },
  { id: "winner_of_the_show", label: "Winner of the Show", points: 30, category: "Endgame" },
];

// v2.5.3.0: each preset can declare an `airSchedule` describing when new
// episodes typically air. Used by getAutoLockState() to auto-lock rosters
// `lockLeadHours` before showtime in the viewer's LOCAL timezone (so an 8pm
// ET primetime show appears at 8pm-local everywhere — which matches everyone's
// intuition: "lock around primetime in my zone"). dayOfWeek uses Sun=0...Sat=6.
// Shows that release in batches or air many nights/week leave `airSchedule`
// undefined; their leagues use manual lock only.
const SHOW_PRESETS = {
  survivor: { name: "Survivor", emoji: "S", color: "#d4a24e", defaultFormat: "captains", episodesPerWeek: 1,
    airSchedule: { dayOfWeek: 3, hour: 20, minute: 0, lockLeadHours: 2 }, // Wed 8pm
    scoringDefaults: ["loses_vote_due_to_risk","volunteers_for_journey___risk","gains_advantage___idol","finds_hidden_immunity_idol","successfully_splits_vote","uses_extra_vote_successfully","steals_vote_successfully","successfully_executes_blindside","1st_to_make_fire_for_their_tribe","wins_shot_in_the_dark","blamed_for_team_loss","last_place_team_immunity","last_place_team_reward","first_place_team_reward","first_place_team_immunity","picked_to_go_with_winner_of_individual_reward","wins_individual_reward","wins_individual_immunity","eliminated_with_idol_advantage","sv_eliminated","plays_hidden_immunity_idol_incorrectly","receives_a_vote","receives_zero_votes_at_tribal","correct_vote","saved_by_advantage","plays_hidden_immunity_idol_successfully","1st_member_of_the_jury","wins_final_4_fire_making_challenge","final_5","final_4","sv_winner"] },
  top_chef: { name: "Top Chef", emoji: "TC", color: "#3dd6c8", defaultFormat: "captains", episodesPerWeek: 1,
    airSchedule: { dayOfWeek: 1, hour: 19, minute: 0, lockLeadHours: 2 }, // Mon 7pm
    scoringDefaults: ["money_earned_per_1k","favorite_dish_in_quickfire","favorite_dish_in_elimination","win_quickfire","win_elimination","win_restaurant_wars","return_from_last_chance_kitchen","tc_final_3","tc_winner","least_favorite_dish_in_quickfire","least_favorite_dish_in_elimination","cuts_self","fails_to_get_all_components_on_plate","entirely_empty_plate","tc_eliminated"] },
  love_island: { name: "Love Island", emoji: "LI", color: "#ff5da0", defaultFormat: "standard", episodesPerWeek: 6,
    scoringDefaults: ["li_coupled","li_dumped","li_recoupled","li_got_text","li_date","li_casa_loyal","li_casa_switched","li_public_vote_saved","li_public_vote_bottom","li_challenge_win","li_final_couple","li_winner","li_crying"] },
  the_bachelor: { name: "The Bachelor/ette", emoji: "B", color: "#e86b8a", defaultFormat: "standard", episodesPerWeek: 1,
    airSchedule: { dayOfWeek: 1, hour: 20, minute: 0, lockLeadHours: 2 }, // Mon 8pm
    scoringDefaults: ["ba_rose","ba_no_rose","ba_first_impression","ba_one_on_one","ba_group_date_rose","ba_two_on_one","ba_kiss","ba_self_elim","ba_crying","ba_limo_exit_drama","ba_hometown","ba_fantasy_suite","ba_final_rose","ba_engaged"] },
  bake_off: { name: "Great British Bake Off", emoji: "BO", color: "#ffd23d", defaultFormat: "standard", episodesPerWeek: 1,
    airSchedule: { dayOfWeek: 5, hour: 20, minute: 0, lockLeadHours: 2 }, // Fri 8pm (Netflix US)
    scoringDefaults: ["bo_star_baker","bo_technical_1st","bo_technical_top3","bo_technical_bottom3","bo_technical_last","bo_hollywood","bo_raw_soggy","bo_praised","bo_criticized","bo_eliminated","bo_final","bo_winner"] },
  custom: { name: "Custom Show", emoji: "TV", color: "#9d5dff", defaultFormat: "captains", episodesPerWeek: 1,
    scoringDefaults: ["eliminated","survived","won_episode","crying","winner_of_the_show"] },
  the_traitors: { name: "The Traitors", emoji: "T", color: "#e24b4a", defaultFormat: "captains", episodesPerWeek: 1,
    airSchedule: { dayOfWeek: 4, hour: 20, minute: 0, lockLeadHours: 2 }, // Thu 8pm (Peacock)
    scoringDefaults: ["tr_murdered","tr_banished","tr_banished_traitor","tr_banished_faithful","tr_won_shield","tr_recruited","tr_survived_roundtable","tr_mission_money","tr_accused","tr_traitor_survived","tr_final","tr_winner"] },
  big_brother: { name: "Big Brother", emoji: "BB", color: "#4d8aff", defaultFormat: "captains", episodesPerWeek: 3,
    airSchedule: { dayOfWeek: 3, hour: 20, minute: 0, lockLeadHours: 2 }, // Wed 8pm (live eviction is the primary lock anchor)
    scoringDefaults: ["bb_won_hoh","bb_won_veto","bb_nominated","bb_used_veto_on_self","bb_veto_used_on_them","bb_backdoored","bb_survived_block","bb_evicted","bb_have_not","bb_won_luxury","bb_unanimous_vote","bb_final_2","bb_winner"] },
  the_challenge: { name: "The Challenge", emoji: "CH", color: "#ff8a3d", defaultFormat: "captains", episodesPerWeek: 1,
    airSchedule: { dayOfWeek: 3, hour: 20, minute: 0, lockLeadHours: 2 }, // Wed 8pm
    scoringDefaults: ["ch_daily_win","ch_elim_win","ch_sent_in","ch_purged","ch_skull","ch_eliminated","ch_last_place_daily","ch_power_position","ch_called_out","ch_final","ch_winner"] },
  drag_race: { name: "RuPaul's Drag Race", emoji: "DR", color: "#9d5dff", defaultFormat: "captains", episodesPerWeek: 1,
    airSchedule: { dayOfWeek: 5, hour: 20, minute: 0, lockLeadHours: 2 }, // Fri 8pm
    scoringDefaults: ["dr_won_maxi","dr_won_mini","dr_top2","dr_safe","dr_low","dr_bottom2","dr_shantay","dr_sashay","dr_runway_praised","dr_snatch_game_win","dr_final","dr_winner"] },
  amazing_race: { name: "The Amazing Race", emoji: "AR", color: "#3ddc84", defaultFormat: "captains", episodesPerWeek: 1,
    airSchedule: { dayOfWeek: 3, hour: 21, minute: 30, lockLeadHours: 2 }, // Wed 9:30pm
    scoringDefaults: ["ar_leg_first","ar_leg_2nd","ar_leg_3rd","ar_leg_last","ar_eliminated","ar_non_elim","ar_detour_first","ar_roadblock_complete","ar_uturn","ar_speed_bump","ar_express_pass","ar_won_prize","ar_final","ar_winner"] },
  love_is_blind: { name: "Love is Blind", emoji: "LB", color: "#c084fc", defaultFormat: "captains", episodesPerWeek: 3,
    scoringDefaults: ["lb_pod_date","lb_engaged","lb_met_irl","lb_argument","lb_broke_up","lb_said_yes","lb_said_no","lb_still_together","lb_crying"] },
};

// v2.5.3.0: derived roster-lock state from the show's airSchedule plus the
// commissioner's manual override. Pure function — no timers, no setState. The
// effective lock state is recomputed at render time so it stays accurate as
// the clock ticks, with no background polling. Caller is responsible for
// re-rendering periodically (or on user action) if they need the value to
// update without interaction. For our consumers — depth-chart save buttons,
// scoring tab — that happens naturally on every interaction.
//
// Lock window: [airtime - lockLeadHours, week-finalized]. After airtime, the
// roster stays locked until the commissioner finalizes the current week
// (sets weekStatus[currentWeek] = "finalized"). That intentionally bridges
// the "episode aired but I haven't scored yet" gap so managers can't sneak
// in a roster change before scoring.
function getAutoLockState(league, now) {
  const schedule = SHOW_PRESETS[league?.showType]?.airSchedule;
  if (!schedule) return { autoLocked: false };
  const currentWeek = String(league?.currentWeek || 1);
  if (league?.weekStatus?.[currentWeek]?.status === "finalized") return { autoLocked: false };

  const nowDate = now || new Date();
  const lead = Number(schedule.lockLeadHours) || 2;

  // Find the most recent occurrence of (dayOfWeek, hour, minute) at or before
  // `nowDate`. That's the upcoming/current week's airtime; the lock window
  // started `lead` hours before it.
  const candidate = new Date(nowDate);
  candidate.setHours(Number(schedule.hour) || 20, Number(schedule.minute) || 0, 0, 0);
  let dayDiff = (candidate.getDay() - (Number(schedule.dayOfWeek) || 0) + 7) % 7;
  if (dayDiff === 0 && candidate > nowDate) dayDiff = 7;
  candidate.setDate(candidate.getDate() - dayDiff);
  const lockStart = new Date(candidate.getTime() - lead * 3600 * 1000);

  if (nowDate >= lockStart) {
    return { autoLocked: true, lockStart, airtime: candidate };
  }
  // Otherwise compute the next lock window for the UI to display.
  const nextAirtime = new Date(candidate);
  nextAirtime.setDate(nextAirtime.getDate() + 7);
  const nextLockStart = new Date(nextAirtime.getTime() - lead * 3600 * 1000);
  return { autoLocked: false, nextLockStart, nextAirtime };
}

// Effective roster lock state. Manual override (`league.rostersLocked === true`)
// always wins as a force-lock; otherwise auto-lock applies. There's no manual
// force-unlock during an active auto-lock window — commissioners who need to
// edit rosters after airtime should score the week (which finalizes it and
// releases the auto-lock).
function isRosterLocked(league) {
  if (league?.rostersLocked === true) return true;
  return getAutoLockState(league).autoLocked === true;
}

// v2.6.1.0: per-league audit log. Append-only transaction log visible to ALL
// league members (not just commissioners). The intent is detection of
// commissioner abuse — e.g. a commissioner editing someone else's roster
// while rosters are "locked" — without needing server-side enforcement.
// Storage: `league.auditLog` array of { time, type, actorName?, desc, meta? }
// capped at the last 500 entries to keep the league document bounded (~50 KB
// max even with verbose descriptions). Returns a new league object — callers
// pipe through onUpdate as usual.
//
// Wire this into key write paths: roster lock toggle, depth-chart save,
// scoring save, team add/remove, week finalize. Not exhaustive by design —
// "doesn't need to be robust, just a transaction log with timestamps".
// v2.6.5.0: derive the show-wide scoring key from `league.seasonNumber` — a
// structured integer — instead of free-text seasonName. Eliminates whitespace /
// casing / "Season 47" vs "S47" mismatches that would silently drop events.
// Returns null when the league hasn't picked a season number yet (the UI gates
// useShowWideScoring on this field being set).
function getShowSeasonKey(league) {
  const n = Number(league?.seasonNumber);
  if (!n || n < 1) return null;
  return `season_${n}`;
}

// v2.6.3.0: merge show-wide event counts into a league's weeklyScores so
// downstream consumers (calcStandings, calcContestantWeekPoints, the cast tab
// breakdown, etc.) see them as additional per-rule scores on the same shape.
// Pure function. `showScoringData` is the slice already loaded for this
// league's `(showType, seasonKey)`. Match contestants by case-insensitive
// trimmed name. Each league applies its OWN points value per rule (read from
// league.scoringRules), so a single show-wide event can be worth different
// totals across leagues.
function mergeShowWideScoring(league, showScoringData) {
  if (!league?.useShowWideScoring || !showScoringData) return league;
  const rulesById = Object.fromEntries((league.scoringRules || []).map(r => [r.id, r]));
  const contestants = league.contestants || [];
  const findContestant = (name) => {
    const norm = String(name || "").toLowerCase().trim();
    return contestants.find(c => String(c.name || "").toLowerCase().trim() === norm);
  };
  const nextWeekly = { ...(league.weeklyScores || {}) };
  Object.entries(showScoringData).forEach(([episode, perContestant]) => {
    if (!perContestant) return;
    const epScores = { ...(nextWeekly[episode] || {}) };
    Object.entries(perContestant).forEach(([cName, rules]) => {
      const c = findContestant(cName);
      if (!c || !rules) return;
      const cScores = { ...(epScores[c.id] || {}) };
      Object.entries(rules).forEach(([ruleId, count]) => {
        const r = rulesById[ruleId];
        if (!r) return;
        const pts = Number(count) * Number(r.points || 0);
        if (pts !== 0) cScores[ruleId] = (Number(cScores[ruleId]) || 0) + pts;
      });
      epScores[c.id] = cScores;
    });
    nextWeekly[episode] = epScores;
  });
  return { ...league, weeklyScores: nextWeekly, _showWideMerged: true };
}

function appendAudit(league, entry) {
  const next = [
    { time: Date.now(), ...entry },
    ...(Array.isArray(league?.auditLog) ? league.auditLog : []),
  ];
  // Cap at 500 — keeps the league doc small and bounded.
  return { ...league, auditLog: next.slice(0, 500) };
}

// Cadence-aware factory. Returns the same shape as the old static
// FORMAT_INFO const (object keyed by format with name/desc/icon). Pass `arg`
// as a league or as a small object with `episodesPerWeek` (CreateLeagueScreen
// passes the latter because its local state isn't a league yet). Default
// (episodesPerWeek === 1 or missing) reads identically to a weekly-cadence
// show — that's the backwards-compat guarantee.
//
// Compound semantic for standard/captains when episodesPerWeek > 1: scoring
// goes per-episode but roster moves (snake redraft, captains swap) stay
// weekly per the locked Phase 4 design. Append-clause pattern (", scoring
// per episode") reflects that — using a "Per-episode" adjective would
// advertise behavior the league doesn't actually do.
function formatInfo(arg) {
  const isMultiEp = effectiveEpisodesPerWeek(arg) > 1;
  return {
    standard: {
      name: "Standard",
      desc: `Weekly snake redraft. Each manager picks contestants each week${isMultiEp ? ", scoring per episode" : ""}. Draft order is inverse of YTD standings. Season-long points race.`,
      icon: "🔄",
    },
    captains: {
      name: "Heroes",
      desc: `One-time draft to build a roster. Hero (2× pts), Side-Kick (1.5× pts), and Vigilante slots. Weekly swap of 1 contestant + reorganize depth chart${isMultiEp ? ", scoring per episode" : ""}. Multiple managers can roster the same contestant.`,
      icon: "🦸",
    },
    survivor_pool: {
      name: "Survivor Pool",
      desc: "Everyone picks one contestant before the season. If your pick is eliminated, you're out. Last person standing wins.",
      icon: "🎯",
    },
    predictions: {
      name: "Predictions",
      desc: `Commissioner creates questions each ${isMultiEp ? "episode" : "week"}. Players predict outcomes (pick one, yes/no, rank these). Points for correct answers.`,
      icon: "🔮",
    },
    salary_cap: {
      name: "Salary Cap",
      desc: "Fixed budget to build your roster. Commissioner sets prices for each contestant. Spend wisely — premium picks cost more. Season-long roster.",
      icon: "💰",
    },
    elimination_pool: {
      name: "Elimination Pool",
      desc: `Each ${isMultiEp ? "episode" : "week"}, pick one contestant you think will survive. Can't reuse picks. Points for correct calls, penalties for wrong ones.`,
      icon: "💀",
    },
  };
}

function formatPts(val, league) {
  if (league?.decimalScoring === false) return Math.round(val).toString();
  return (Math.round(val * 100) / 100).toFixed(2);
}

function shouldBlur(league, week, userProfile) {
  if (userProfile?.spoilerProtectionOff) return false;
  const weekStatus = league.weekStatus?.[String(week)];
  if (!weekStatus || weekStatus.status !== "finalized") return false;
  const gracePeriod = (league.spoilerGracePeriod || 48) * 3600000;
  if (Date.now() > weekStatus.finalizedAt + gracePeriod) return false;
  if (userProfile?.spoilerRevealed?.[league.id]?.[String(week)]) return false;
  return true;
}

// Scan ALL weekStatus entries for any finalized week still in spoiler grace
// that the current user has not yet revealed. Returns the lowest such week
// number (so reveals proceed in chronological order), or null.
function getActiveSpoilerWeek(league, userProfile) {
  if (userProfile?.spoilerProtectionOff) return null;
  const grace = (league.spoilerGracePeriod || 48) * 3600000;
  const now = Date.now();
  const weeks = Object.entries(league.weekStatus || {})
    .filter(([, status]) => status?.status === "finalized" && status?.finalizedAt)
    .filter(([, status]) => now - status.finalizedAt <= grace)
    .filter(([w]) => !userProfile?.spoilerRevealed?.[league.id]?.[String(w)])
    .map(([w]) => Number(w))
    .sort((a, b) => a - b);
  return weeks.length > 0 ? weeks[0] : null;
}

// ─── Cadence: episodes per week is the source of truth ───
// v2.4.38.0 refactor: scoring is always per-episode in practice. What varies
// between shows is HOW MANY episodes air per week (= how many scoring units
// pass between roster changes). This helper is the canonical source of truth.
//
//   episodesPerWeek === 1 (or undefined): one episode per week. Labels say
//                          "Week N" / "Wk N". Most shows (Survivor, Bachelor,
//                          Bake Off, Top Chef, etc.).
//   episodesPerWeek >  1 : multiple episodes per week. Labels say
//                          "Episode N" / "Ep N" since the scoring unit no
//                          longer maps 1:1 with a week. Shows like Love
//                          Island (~6/wk) and Big Brother (3/wk).
//
// Legacy fallback: old leagues stored a `scoringCadence: "weekly" | "episode"`
// flag that conflated two things ("how often to score" + "how often rosters
// change"). v2.4.38.0 drops that conflation. For leagues created before the
// refactor that have scoringCadence === "episode" without an explicit
// episodesPerWeek, fall back to the showType's preset (or 2 as a sentinel
// for "more than 1") so their labels don't silently flip to "Week".
function effectiveEpisodesPerWeek(league) {
  const explicit = Number(league?.episodesPerWeek) || 0;
  if (explicit > 0) return explicit;
  if (league?.scoringCadence === "episode") {
    return Number(SHOW_PRESETS?.[league?.showType]?.episodesPerWeek) || 2;
  }
  return 1;
}

// ─── Cadence-aware UI labels ───
// Three helpers, distinct surfaces:
//   cadenceWord(league)   "Week"     | "Episode"   — full singular noun
//   cadenceShort(league)  "Wk"       | "Ep"        — abbreviated form
//   cadenceLabel(league, n)  "Week 3" | "Episode 3" — noun + number
//                            null/undefined n -> just the unit word, so call
//                            sites can pass possibly-missing values safely.
// cadenceShort does NOT derive from cadenceWord — `"Week".slice(0,2)` would
// yield "We" (wrong abbreviation). Keep these independent.
const cadenceWord = (league) => effectiveEpisodesPerWeek(league) > 1 ? "Episode" : "Week";
const cadenceShort = (league) => effectiveEpisodesPerWeek(league) > 1 ? "Ep" : "Wk";
const cadenceLabel = (league, n) => n != null ? `${cadenceWord(league)} ${n}` : cadenceWord(league);

// ─── Episode metadata: lazy-seed { title, airDate } per episode key ───
// Stores at league.episodes[String(N)] alongside weekStatus / weeklyScores /
// weeklyDepthCharts. Pure metadata — never read by src/scoring.js.
//
// Wired into the three save paths that establish or mutate episode state:
//   1. league-create handleSave  -> seeds episodes["1"]
//   2. advanceWeek                -> seeds episodes[String(nextWeek)]
//   3. weekStatus writes (finalize, unfinalize) -> lazy backfill
//
// airDate inference: prefer weekStatus[N].finalizedAt as the historical signal
// for already-finalized weeks; fall back to Date.now() when no finalizedAt
// exists (new week, unfinalized week, or pre-Phase-2 league missing episodes).
// Optional chaining is mandatory — unfinalized weeks may have weekStatus[N]
// populated as {} with no finalizedAt.
//
// airDate inference reads weekStatus[N].finalizedAt when present so finalize
// flows align both timestamps to the same Date.now() value. Do NOT call
// Date.now() inside this helper for paths where weekStatus was just written —
// that would introduce timestamp drift between the finalize event and the
// episode metadata.
//
// No-op if episodes[N] already exists. First-seed wins.
function ensureEpisode(league, n) {
  const key = String(n);
  if (league?.episodes?.[key]) return league;
  const airDate = league?.weekStatus?.[key]?.finalizedAt || Date.now();
  return {
    ...league,
    episodes: {
      ...(league?.episodes || {}),
      [key]: { title: "", airDate }
    }
  };
}

// ─── Final Lock-In helpers (Heroes only) ───
const isLockInEligible = (league) => league?.format === "captains";
const getLockInStatus = (league) => league?.lockInStatus || "closed";
const isTeamLockedIn = (league, team) => {
  const status = getLockInStatus(league);
  if (status === "locked") return true;
  if (status === "open" && team?.lockedRoster && team.lockedRoster.length > 0) return true;
  return false;
};
// Returns the active contestant pool for a team — locked roster if lock-in is
// active for them, otherwise null (caller falls back to normal logic).
const getEffectiveRoster = (league, team) => {
  if (isTeamLockedIn(league, team) && team?.lockedRoster) return team.lockedRoster;
  return null;
};

function SpoilerBlur({ active, children, onReveal, week, league }) {
  if (!active) return children;
  // v2.4.44.0: cap wrapper at 70vh + overflow hidden so the reveal panel is
  // always within one viewport — testers had to scroll to find the warning on
  // tall tabs (Standings, Scoring). The whole overlay is a button so tapping
  // the eye, the text, or the gradient pill all reveal. Previously only the
  // small Btn at the bottom worked; users instinctively tapped the eye.
  return (
    <div style={{ position: "relative", maxHeight: "70vh", overflow: "hidden", borderRadius: 12 }}>
      <div style={{ filter: "blur(8px) grayscale(1)", userSelect: "none", pointerEvents: "none" }}>
        {children}
      </div>
      <button
        type="button"
        onClick={onReveal}
        aria-label={`Reveal ${cadenceLabel(league, week)} scores`}
        style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(10,10,24,0.78)", borderRadius: 12, zIndex: 10,
          border: "none", padding: 0, font: "inherit", color: "inherit", cursor: "pointer",
        }}
      >
        <div style={{ textAlign: "center", padding: 24, maxWidth: 360 }}>
          <div style={{ fontSize: 52, marginBottom: 10, lineHeight: 1 }}>&#128065;&#65039;</div>
          <div style={{ color: "#e8e8f0", fontWeight: 700, fontSize: 17, marginBottom: 6, fontFamily: "'Anybody',sans-serif" }}>
            {cadenceLabel(league, week)} Scores Finalized
          </div>
          <div style={{ color: "#aaaabf", fontSize: 13, marginBottom: 16, lineHeight: 1.4 }}>
            Tap anywhere on this panel to reveal results &mdash; spoiler protection is on.
          </div>
          <div style={{
            display: "inline-block", padding: "10px 22px",
            background: "linear-gradient(135deg, #e94560, #f5a623)",
            borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13,
            fontFamily: "'Anybody',sans-serif", letterSpacing: "0.02em",
          }}>
            Reveal {cadenceLabel(league, week)}
          </div>
        </div>
      </button>
    </div>
  );
}

function SpoilerText({ active, children }) {
  if (!active) return children;
  return <span style={{ filter: "blur(8px)", userSelect: "none", color: "#6a6a8a" }}>{children}</span>;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// v2.4.50.0: generalized roster category minimums.
// Captains-format leagues can require N of each category-value on a depth chart
// (e.g. 2 Male + 2 Female, or 1 per tribe). The old schema only supported
// gender via `captainsConfig.{genderedRoster, minMale, minFemale}`; the new
// schema uses `captainsConfig.{minCategory, minimums}` where minCategory is
// "gender" or "tribe" and minimums is an object mapping each value to a
// required count (e.g. {Male: 2, Female: 2} or {Manulevu: 1, Yala: 1}).
// Returns null when no minimums are active (most leagues), so consumers can
// short-circuit cheaply.
function getRosterMinimums(league) {
  const cfg = league?.captainsConfig || {};
  if (cfg.minCategory) {
    const minimums = cfg.minimums || {};
    const total = Object.values(minimums).reduce((s, v) => s + (Number(v) || 0), 0);
    if (total === 0) return null;
    return { category: cfg.minCategory, minimums, total };
  }
  // Legacy: genderedRoster flag with separate minMale/minFemale fields.
  if (cfg.genderedRoster) {
    const m = Number(cfg.minMale) || 0;
    const f = Number(cfg.minFemale) || 0;
    if (m + f === 0) return null;
    return { category: "gender", minimums: { Male: m, Female: f }, total: m + f };
  }
  return null;
}

// Count a roster (array of contestant ids) by category value. Returns an
// object like { Male: 2, Female: 1, unset: 0 } for gender, or
// { Manulevu: 2, Yala: 1, unset: 0 } for tribe. Contestants who lack the
// category attribute roll into "unset" so missing data is visible to commissioners.
function countRosterByCategory(rosterIds, league, category) {
  const counts = { unset: 0 };
  const contestants = league?.contestants || [];
  (rosterIds || []).filter(Boolean).forEach(cid => {
    const c = contestants.find(x => x.id === cid);
    const val = c?.[category];
    if (!val) counts.unset++;
    else counts[val] = (counts[val] || 0) + 1;
  });
  return counts;
}

// Lookup the current couple-partner for a contestant. Returns the other contestant's
// id or null. Couples are stored at league.couples = [{ id, members: [id1, id2] }];
// a contestant should appear in at most one couple at a time (the Manage > Couples
// editor enforces this by auto-dissolving any prior couple for either member on add).
function getCouplePartner(league, contestantId) {
  const couples = league?.couples || [];
  for (const c of couples) {
    const m = c.members || [];
    if (m.includes(contestantId)) return m.find(x => x !== contestantId) || null;
  }
  return null;
}

// All invite codes (league-level and per-team) are 6 chars, no ambiguous characters
function generateInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let c = "";
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}

function getInverseDraftOrder(standings) {
  return [...standings].reverse().map(t => t.id);
}

function getTribeColor(league, contestant) {
  if (!contestant || contestant.status === "eliminated") return "#2a2a4a";
  const colors = league.tribeColors || {};
  const tribe = contestant.tribe;
  if (tribe && colors[tribe]) return colors[tribe];
  return "#e94560"; // default
}

// Returns [{ id, base, multiplier, pts }] for every contestant that was on
// `team`'s roster in `weekNum`. `pts` is the multiplied value (the actual
// contribution to the team's week total). Used by the records computation and
// by per-week game log displays.
function getTeamWeekContributions(league, team, weekNum) {
  let parts = [];
  if (league.format === "captains") {
    const dc = team.weeklyDepthCharts?.[String(weekNum)] || team.depthChart || {};
    if (dc.captain)   parts.push({ id: dc.captain,   multiplier: 2 });
    if (dc.coCaptain) parts.push({ id: dc.coCaptain, multiplier: 1.5 });
    (dc.regulars||[]).forEach(rid => parts.push({ id: rid, multiplier: 1 }));
  } else {
    const wr = team.weeklyRosters?.[String(weekNum)] || [];
    parts = wr.map(id => ({ id, multiplier: 1 }));
  }
  return parts.filter(p => p.id).map(p => {
    const base = calcContestantWeekPoints(league.weeklyScores?.[String(weekNum)]||{}, p.id);
    return { ...p, base, pts: Math.round(base * p.multiplier * 100) / 100 };
  });
}

// One-pass computation of per-team + league-wide records. Called once per
// StandingsTab render via useMemo. Returns:
//   { perTeam: { [teamId]: { bestW, worstW, starPlayer, benchWarmer,
//                            bigHit, bigMiss, hotStreak, coldStreak } },
//     league:  { weekCeiling, weekFloor, mvp, woodenSpoon,
//                comeback, choke, mostConsistent, mostVolatile } }
// Each leaf record carries `{ pts, wk?, teamId?, contestantId? }` so the
// display layer can resolve names + render context without re-querying.
function computeLeagueRecords(league, standings) {
  const weeks = Object.keys(league.weeklyScores || {}).sort((a,b) => +a - +b);
  const teams = (standings && standings.length > 0) ? standings : (league.teams || []);
  const contestants = league.contestants || [];

  const perTeam = {};
  teams.forEach(team => {
    const weeklyTotals = weeks.map(w => team.weeklyTotals?.[w] ?? calcTeamWeekPoints(league, team, w));

    let bestW = { wk:null, pts:-Infinity }, worstW = { wk:null, pts:Infinity };
    weeks.forEach((w,i) => {
      const p = weeklyTotals[i];
      if (p > bestW.pts) bestW = { wk:w, pts:p };
      if (p < worstW.pts) worstW = { wk:w, pts:p };
    });

    const contribTotals = {};
    let bigHit = { id:null, wk:null, pts:-Infinity }, bigMiss = { id:null, wk:null, pts:Infinity };
    weeks.forEach(w => {
      getTeamWeekContributions(league, team, w).forEach(c => {
        contribTotals[c.id] = (contribTotals[c.id] || 0) + c.pts;
        if (c.pts > bigHit.pts) bigHit = { id:c.id, wk:w, pts:c.pts };
        if (c.pts < bigMiss.pts) bigMiss = { id:c.id, wk:w, pts:c.pts };
      });
    });
    let starPlayer = null, benchWarmer = null;
    Object.entries(contribTotals).forEach(([id, pts]) => {
      if (!starPlayer || pts > starPlayer.pts) starPlayer = { id, pts };
      if (!benchWarmer || pts < benchWarmer.pts) benchWarmer = { id, pts };
    });

    let hotStreak = 0, coldStreak = 0, curHot = 0, curCold = 0;
    weeklyTotals.forEach(p => {
      if (p > 0) { curHot++; curCold = 0; }
      else if (p < 0) { curCold++; curHot = 0; }
      else { curHot = 0; curCold = 0; }
      if (curHot > hotStreak) hotStreak = curHot;
      if (curCold > coldStreak) coldStreak = curCold;
    });

    perTeam[team.id] = {
      bestW: bestW.pts === -Infinity ? null : bestW,
      worstW: worstW.pts === Infinity ? null : worstW,
      starPlayer, benchWarmer,
      bigHit: bigHit.pts === -Infinity ? null : bigHit,
      bigMiss: bigMiss.pts === Infinity ? null : bigMiss,
      hotStreak, coldStreak,
    };
  });

  let weekCeiling = { teamId:null, wk:null, pts:-Infinity }, weekFloor = { teamId:null, wk:null, pts:Infinity };
  teams.forEach(team => {
    weeks.forEach(w => {
      const p = team.weeklyTotals?.[w] ?? calcTeamWeekPoints(league, team, w);
      if (p > weekCeiling.pts) weekCeiling = { teamId:team.id, wk:w, pts:p };
      if (p < weekFloor.pts) weekFloor = { teamId:team.id, wk:w, pts:p };
    });
  });

  let mvp = { id:null, pts:-Infinity }, woodenSpoon = { id:null, pts:Infinity };
  contestants.forEach(c => {
    const t = Math.round(weeks.reduce((s,w) => s + calcContestantWeekPoints(league.weeklyScores?.[w]||{}, c.id), 0) * 100) / 100;
    if (t > mvp.pts) mvp = { id:c.id, pts:t };
    if (t < woodenSpoon.pts) woodenSpoon = { id:c.id, pts:t };
  });

  let comeback = { teamId:null, wk:null, swing:-Infinity }, choke = { teamId:null, wk:null, swing:Infinity };
  teams.forEach(team => {
    const totals = weeks.map(w => team.weeklyTotals?.[w] ?? calcTeamWeekPoints(league, team, w));
    for (let i = 1; i < totals.length; i++) {
      const sw = Math.round((totals[i] - totals[i-1]) * 100) / 100;
      if (sw > comeback.swing) comeback = { teamId:team.id, wk:weeks[i], swing:sw };
      if (sw < choke.swing) choke = { teamId:team.id, wk:weeks[i], swing:sw };
    }
  });

  let mostConsistent = { teamId:null, sd:Infinity }, mostVolatile = { teamId:null, sd:-Infinity };
  if (weeks.length >= 2) {
    teams.forEach(team => {
      const totals = weeks.map(w => team.weeklyTotals?.[w] ?? calcTeamWeekPoints(league, team, w));
      const mean = totals.reduce((s,x) => s + x, 0) / totals.length;
      const variance = totals.reduce((s,x) => s + (x - mean)**2, 0) / totals.length;
      const sd = Math.sqrt(variance);
      if (sd < mostConsistent.sd) mostConsistent = { teamId:team.id, sd };
      if (sd > mostVolatile.sd) mostVolatile = { teamId:team.id, sd };
    });
  }

  return {
    perTeam,
    league: {
      weekCeiling: weekCeiling.pts === -Infinity ? null : weekCeiling,
      weekFloor: weekFloor.pts === Infinity ? null : weekFloor,
      mvp: mvp.id ? mvp : null,
      woodenSpoon: woodenSpoon.id ? woodenSpoon : null,
      comeback: comeback.teamId ? comeback : null,
      choke: choke.teamId ? choke : null,
      mostConsistent: mostConsistent.teamId ? mostConsistent : null,
      mostVolatile: mostVolatile.teamId ? mostVolatile : null,
    },
  };
}

// ─── Icons ───
function Icon({ name, size = 18 }) {
  const d = {
    trophy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
    users: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    star: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    settings: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>,
    chevron: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
    back: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    chart: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    x: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    grid: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    save: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
    crown: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M3 20h18"/></svg>,
    check: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  };
  return d[name] || null;
}

// ─── UI Primitives ───
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div style={{ position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",
      background:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)",animation:"fadeIn 0.15s ease" }} onClick={onClose}>
      <div style={{ background:"#1a1a2e",border:"1px solid #2a2a4a",borderRadius:16,padding:28,
        width:wide?700:500,maxWidth:"93vw",maxHeight:"88vh",overflowY:"auto",
        boxShadow:"0 24px 80px rgba(0,0,0,0.5)",animation:"slideUp 0.2s ease" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
          <h3 style={{ margin:0,fontSize:18,color:"#e8e8f0",fontFamily:"'Anybody',sans-serif",fontWeight:700 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#888",cursor:"pointer",padding:4 }}><Icon name="x" size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:"block",fontSize:12,color:"#8888aa",marginBottom:5,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em" }}>{label}</label>}
      <input {...props} style={{ width:"100%",padding:"10px 14px",background:"#12121f",border:"1px solid #2a2a4a",
        borderRadius:8,color:"#e8e8f0",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"'Outfit',sans-serif",...(props.style||{}) }} />
    </div>
  );
}

function Select({ label, options, ...props }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:"block",fontSize:12,color:"#8888aa",marginBottom:5,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em" }}>{label}</label>}
      <select {...props} style={{ width:"100%",padding:"10px 14px",background:"#12121f",border:"1px solid #2a2a4a",
        borderRadius:8,color:"#e8e8f0",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"'Outfit',sans-serif" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, variant="primary", small, ...props }) {
  const s = {
    primary: { background:"linear-gradient(135deg,#e94560,#c23152)",color:"#fff" },
    secondary: { background:"#2a2a4a",color:"#ccc" },
    ghost: { background:"transparent",color:"#8888aa",border:"1px solid #2a2a4a" },
    danger: { background:"#4a1525",color:"#e94560",border:"1px solid #5a2535" },
    success: { background:"linear-gradient(135deg,#2a9d8f,#1a7a6f)",color:"#fff" },
  };
  return (
    <button {...props} style={{ padding:small?"6px 12px":"10px 20px",borderRadius:8,border:"none",cursor:"pointer",
      fontSize:small?12:14,fontWeight:600,fontFamily:"'Outfit',sans-serif",display:"inline-flex",alignItems:"center",gap:6,
      transition:"all 0.15s ease",opacity:props.disabled?0.5:1,...s[variant],...(props.style||{}) }}>
      {children}
    </button>
  );
}

function Badge({ children, color="#e94560" }) {
  return <span style={{ display:"inline-block",padding:"2px 8px",borderRadius:99,fontSize:11,fontWeight:700,background:color+"22",color,letterSpacing:"0.03em" }}>{children}</span>;
}

function EmptyState({ message, action, actionLabel }) {
  return (
    <div style={{ textAlign:"center",padding:"36px 24px",background:"#12121f",borderRadius:12,border:"1px dashed #2a2a4a" }}>
      <p style={{ color:"#6a6a8a",fontSize:14,margin:0,lineHeight:1.6 }}>{message}</p>
      {action && actionLabel && <Btn small variant="secondary" onClick={action} style={{marginTop:12}}>{actionLabel}</Btn>}
    </div>
  );
}

function Spinner({ size=20, color="#e94560" }) {
  return <div style={{ width:size,height:size,border:`2px solid ${color}33`,borderTop:`2px solid ${color}`,borderRadius:"50%",animation:"spin 0.6s linear infinite" }}/>;
}

// Shared fullscreen photo + bio modal. Lifted out of ContestantAvatar in
// v2.4.30.0 so the same modal can open from any contestant name click, not just
// thumbnail clicks. Renders the contestant's photo (or colored initial when no
// photo), name, and bio with the Label:value pretty-printing the cast tab uses.
// Caller mounts conditionally — this component always renders its portal when
// called, so use `{open && <ContestantPhotoLightbox .../>}`.
function ContestantPhotoLightbox({ contestant, league, onClose }) {
  if (!contestant) return null;
  const color = getTribeColor(league, contestant);
  const hasPhoto = !!contestant.photoUrl;
  return ReactDOM.createPortal(
    <div onClick={onClose} style={{
      position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.92)",
      display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:9999,cursor:"pointer",
      padding:"40px 20px",overflowY:"auto",WebkitOverflowScrolling:"touch"
    }}>
      <div style={{ maxWidth:400,width:"100%",textAlign:"center",flexShrink:0 }} onClick={e=>e.stopPropagation()}>
        {hasPhoto ? (
          // v2.5.1.1: maxHeight 55vh cap so tall portraits don't push the bio
          // and Close button below the fold — the rest of the layout is the
          // original (v2.5.1.0 went too far stripping things down).
          <img src={contestant.photoUrl} alt={contestant?.name} style={{ width:"100%",maxWidth:360,maxHeight:"55vh",borderRadius:14,objectFit:"contain",border:`3px solid ${color}` }} />
        ) : (
          <div style={{ width:"min(360px,80vw)",aspectRatio:"1/1",borderRadius:14,background:color,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",fontFamily:"'Anybody',sans-serif",fontSize:140,fontWeight:900,color:"#fff",border:`3px solid ${color}` }}>
            {contestant.name?.[0] || "?"}
          </div>
        )}
        <div style={{ marginTop:12,color:"#e8e8f0",fontFamily:"'Anybody',sans-serif",fontSize:22,fontWeight:700 }}>{contestant?.name}</div>
        {contestant?.bio && (
          <div style={{ marginTop:12,textAlign:"left",padding:"0 8px",fontSize:13,lineHeight:1.8 }}>
            {contestant.bio.split("\n").map((line, i) => {
              const colonIdx = line.indexOf(":");
              if (colonIdx > 0 && colonIdx < 30 && i < 10) {
                const label = line.slice(0, colonIdx + 1);
                const value = line.slice(colonIdx + 1);
                return <div key={i}><span style={{ fontWeight:700,color:"#e8e8f0" }}>{label}</span><span style={{ color:"#8888aa" }}>{value}</span></div>;
              }
              if (!line.trim()) return <div key={i} style={{ height:8 }}/>;
              return <div key={i} style={{ color:"#8888aa" }}>{line}</div>;
            })}
          </div>
        )}
        <button onClick={onClose} style={{ marginTop:16,marginBottom:20,background:"#2a2a4a",border:"none",borderRadius:8,padding:"8px 20px",color:"#ccc",fontSize:13,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>Close</button>
      </div>
    </div>,
    document.body
  );
}

function ContestantAvatar({ contestant, league, size=32 }) {
  const [showFull, setShowFull] = useState(false);
  const [imgError, setImgError] = useState(false);
  const color = getTribeColor(league, contestant);
  const radius = Math.round(size * 0.25);
  const fontSize = Math.round(size * 0.4);
  const hasPhoto = !!contestant?.photoUrl && !imgError;
  return (
    <>
      {hasPhoto ? (
        <div onClick={(e)=>{e.stopPropagation();setShowFull(true)}} style={{
          width:size,height:size,borderRadius:radius,border:`2px solid ${color}`,cursor:"pointer",flexShrink:0,overflow:"hidden"
        }}>
          <img src={contestant.photoUrl} alt={contestant?.name} onError={()=>setImgError(true)}
            style={{ width:"100%",height:"100%",objectFit:"cover",
              objectPosition:`center ${contestant?.photoCropY||20}%`,
              transform:`scale(${contestant?.photoCropZoom||1})`,
              transformOrigin:`center ${contestant?.photoCropY||20}%` }} />
        </div>
      ) : (
        <div style={{ width:size,height:size,borderRadius:radius,background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize,fontWeight:700,color:"#fff",flexShrink:0 }}>
          {contestant?.name?.[0] || "?"}
        </div>
      )}
      {showFull && <ContestantPhotoLightbox contestant={contestant} league={league} onClose={()=>setShowFull(false)} />}
    </>
  );
}

function MultiplierBadge({ role }) {
  if (role === "captain") return <span style={{ fontSize:10,fontWeight:800,color:"#f5a623",background:"#f5a62322",padding:"1px 6px",borderRadius:4,marginLeft:6 }}>Hero 2×</span>;
  if (role === "coCaptain") return <span style={{ fontSize:10,fontWeight:800,color:"#4ecdc4",background:"#4ecdc422",padding:"1px 6px",borderRadius:4,marginLeft:6 }}>SK 1.5×</span>;
  return null;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOME SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function CreateLeagueScreen({ onSave, onCancel, commissionerUid, featureFlags }) {
  const [step, setStep] = useState(1);
  // v2.4.47.0: Guided vs Advanced league-creation mode. Guided (default)
  // splits the dense "Basics" step into three bite-sized sub-steps with
  // explainer text — for users who don't already know what every option
  // means. Advanced renders the whole step on one page like before, for
  // returning commissioners or anyone who's set up fantasy leagues before.
  // subStep is only meaningful when wizardMode && step === 1.
  //   subStep 1 = Show + League Name + Season Name (the "what")
  //   subStep 2 = Format + format-specific config (the central decision)
  //   subStep 3 = Optional settings (episodes/week + h2h + best ball + roto + decimal)
  const [wizardMode, setWizardMode] = useState(true);
  const [subStep, setSubStep] = useState(1);

  // Step 1: Basics
  const [name, setName] = useState("");
  const [showType, setShowType] = useState("survivor");
  const [showName, setShowName] = useState("");
  const [seasonName, setSeasonName] = useState("");
  // v2.6.5.0: structured season number used for show-wide scoring matching.
  // Defaults to undefined (no commitment) — commissioner picks during create.
  const [seasonNumber, setSeasonNumber] = useState("");
  const [format, setFormat] = useState("captains");

  // Step 2: Format config + scoring
  const [regularSlots, setRegularSlots] = useState(3);
  const [picksPerManager, setPicksPerManager] = useState(2);
  const [genderedDraft, setGenderedDraft] = useState(false);
  const [episodesPerWeek, setEpisodesPerWeek] = useState(SHOW_PRESETS["survivor"]?.episodesPerWeek || 1);
  const [genderedRoster, setGenderedRoster] = useState(false);
  const [minMale, setMinMale] = useState(2);
  const [minFemale, setMinFemale] = useState(2);
  const [headToHead, setHeadToHead] = useState(false);
  const [bestBall, setBestBall] = useState(false);
  const [salaryBudget, setSalaryBudget] = useState(100);
  const [rotoScoring, setRotoScoring] = useState(false);
  const [decimalScoring, setDecimalScoring] = useState(true);
  const [scoringRules, setScoringRules] = useState([]);

  // Step 3: Teams
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamOwner, setNewTeamOwner] = useState("");

  // Custom rule creation
  const [newRuleName, setNewRuleName] = useState("");
  const [newRulePoints, setNewRulePoints] = useState("");
  const [newRuleCategory, setNewRuleCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  useEffect(() => {
    const preset = SHOW_PRESETS[showType];
    if (preset) {
      // v2.5.0.0: only Heroes (captains) is selectable at launch. Force the
      // format regardless of preset.defaultFormat so picking Love Island /
      // Bachelor / Bake Off (which default to "standard" in the preset table)
      // doesn't silently switch to a format that's not yet shipped. Remove
      // this override when other formats launch.
      setFormat("captains");
      setScoringRules(DEFAULT_SCORING_RULES.filter(r => preset.scoringDefaults.includes(r.id)));
      // Episodes-per-week cascades from showType. Manual override via the
      // number input persists until the user changes showType again, at
      // which point the preset wins.
      setEpisodesPerWeek(preset.episodesPerWeek || 1);
    }
  }, [showType]);

  function addTeam() {
    if (!newTeamName.trim()) return;
    setTeams([...teams, { id: generateId(), name: newTeamName.trim(), owner: newTeamOwner.trim() || newTeamName.trim(), depthChart: { captain: null, coCaptain: null, regulars: [] }, weeklyRosters: {}, weeklyDepthCharts: {} }]);
    setNewTeamName("");
    setNewTeamOwner("");
  }

  function removeTeam(id) { setTeams(teams.filter(t=>t.id!==id)); }

  function toggleRule(ruleId) {
    const exists = scoringRules.find(r=>r.id===ruleId);
    if (exists) {
      setScoringRules(scoringRules.filter(r=>r.id!==ruleId));
    } else {
      const rule = DEFAULT_SCORING_RULES.find(r=>r.id===ruleId);
      if (rule) setScoringRules([...scoringRules, rule]);
    }
  }

  function updateRulePoints(ruleId, points) {
    setScoringRules(scoringRules.map(r=>r.id===ruleId?{...r,points:Number(points)}:r));
  }

  async function handleSave() {
    if (!name.trim()) return;
    if (format === "captains" && genderedRoster && (Number(minMale)+Number(minFemale)) > (Number(regularSlots)+2)) {
      alert(`Gender minimums (${Number(minMale)+Number(minFemale)}) exceed total roster size (${Number(regularSlots)+2}). Reduce Min Male or Min Female before creating the league.`);
      return;
    }
    const preset = SHOW_PRESETS[showType];
    // v2.6.7.0: auto-import admin-managed show cast at create time when the
    // commissioner picked a season number AND the admin has populated
    // showCast/<showType>/season_<N>. Universal-cast principle: same show +
    // same season = same contestants across every league. Default-on; no
    // user-facing toggle. If admin hasn't set up the cast yet, the
    // contestants array starts empty and the commissioner can still add
    // manually or hit Import Cast on the Cast tab later.
    let importedContestants = [];
    if (seasonNumber) {
      try {
        const cast = await loadData(`showCast/${showType}/season_${Number(seasonNumber)}`, null);
        if (Array.isArray(cast?.contestants)) {
          importedContestants = cast.contestants.map(sc => ({
            id: generateId(),
            name: sc.name,
            photoUrl: sc.photoUrl || "",
            ...(sc.photoCropY != null ? { photoCropY: sc.photoCropY } : {}),
            gender: sc.gender || "",
            tribe: sc.tribe || null,
            status: "active",
            bio: "",
          }));
        }
      } catch { /* fall through with empty contestants */ }
    }
    let league = {
      id: generateId(),
      name: name.trim(),
      showType,
      showName: showType === "custom" ? showName.trim() : preset.name,
      seasonName: seasonName.trim() || (seasonNumber ? `Season ${seasonNumber}` : "Season 1"),
      ...(seasonNumber ? { seasonNumber: Number(seasonNumber) } : {}),
      format,
      captainsConfig: format === "captains" ? {
        regularSlots: Number(regularSlots),
        genderedRoster,
        minMale: Number(minMale) || 0,
        minFemale: Number(minFemale) || 0,
      } : null,
      standardConfig: format === "standard" ? { picksPerManager: Number(picksPerManager), genderedDraft } : null,
      episodesPerWeek: Number(episodesPerWeek) || 1,
      survivorPoolConfig: format === "survivor_pool" ? {} : null,
      salaryCapConfig: format === "salary_cap" ? { budget: Number(salaryBudget) } : null,
      eliminationPoolConfig: format === "elimination_pool" ? {} : null,
      predictionsConfig: format === "predictions" ? {} : null,
      headToHead,
      rotoScoring,
      decimalScoring,
      bestBall: format === "captains" ? bestBall : false,
      scoringRules,
      contestants: importedContestants,
      teams,
      weeklyScores: {},
      currentWeek: 1,
      commissionerUid: commissionerUid || null,
      leagueInviteCode: generateInviteCode(),
      createdAt: Date.now(),
    };
    league = ensureEpisode(league, 1);
    onSave(league);
  }

  const preset = SHOW_PRESETS[showType];
  const availableRules = DEFAULT_SCORING_RULES.filter(r => preset?.scoringDefaults?.includes(r.id));
  const allShowRules = DEFAULT_SCORING_RULES;

  // Group available rules by category
  const rulesByCategory = {};
  allShowRules.forEach(r => {
    const cat = r.category || "Other";
    if (!rulesByCategory[cat]) rulesByCategory[cat] = [];
    rulesByCategory[cat].push(r);
  });

  // Step indicator. In wizard mode, step 1 expands into 3 sub-steps so the
  // progress bar shows 5 segments total (3 sub-steps + Scoring + Teams).
  // Advanced mode keeps the original 3 segments.
  const totalSteps = wizardMode ? 5 : 3;
  // Linear step number used to colour progress segments + display "step X of N".
  const linearStep = wizardMode
    ? (step === 1 ? subStep : step + 2) // step1.subStep1→1, 1.2→2, 1.3→3, step2→4, step3→5
    : step;

  // Back button behaviour: in wizard mode, walk back through sub-steps before
  // popping to step 1 → 2 → 3; in advanced, just step- or cancel.
  function handleBack() {
    if (wizardMode) {
      if (step === 1 && subStep > 1) { setSubStep(subStep - 1); return; }
      if (step === 2) { setStep(1); setSubStep(3); return; }
      if (step === 3) { setStep(2); return; }
      onCancel();
    } else {
      if (step > 1) setStep(step - 1);
      else onCancel();
    }
  }

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:12 }}>
        <button onClick={handleBack} style={{ background:"none",border:"none",color:"#8888aa",cursor:"pointer",padding:4 }}><Icon name="back" size={20}/></button>
        <h2 style={{ margin:0,fontSize:20,fontFamily:"'Anybody',sans-serif",fontWeight:800,color:"#e8e8f0",flex:1 }}>Create League</h2>
        <div style={{ fontSize:12,color:"#6a6a8a" }}>Step {linearStep} of {totalSteps}</div>
      </div>

      {/* Guided / Advanced mode toggle */}
      <div style={{ display:"flex",gap:6,marginBottom:16,padding:4,background:"#0d0d18",border:"1px solid #1e1e38",borderRadius:99 }}>
        {[
          { id:true, label:"Guided", hint:"Step by step — recommended for first leagues" },
          { id:false, label:"Advanced", hint:"All settings on one page" },
        ].map(m => (
          <button key={String(m.id)} onClick={()=>{ setWizardMode(m.id); setSubStep(1); }} title={m.hint} style={{
            flex:1,padding:"7px 12px",borderRadius:99,border:"none",cursor:"pointer",
            background: wizardMode===m.id ? "#e9456022" : "transparent",
            color: wizardMode===m.id ? "#e94560" : "#7a7a9a",
            fontSize:12,fontWeight:wizardMode===m.id?700:600,fontFamily:"'Outfit',sans-serif",transition:"all .15s ease",
          }}>{m.label}</button>
        ))}
      </div>

      {/* Step indicator pills */}
      <div style={{ display:"flex",gap:6,marginBottom:20 }}>
        {Array.from({length: totalSteps}).map((_,i) => (
          <div key={i} style={{ flex:1,height:4,borderRadius:2,background:i<linearStep?"#e94560":"#1e1e38",transition:"all .3s" }}/>
        ))}
      </div>

      {/* ─── STEP 1: BASICS ───
          Wizard mode breaks the dense old step 1 into 3 sub-steps with
          explainer text. Advanced shows everything at once. */}
      {step === 1 && (
        <div>
          {/* SECTION A — "the what": show + name + season */}
          {(!wizardMode || subStep === 1) && (
            <div>
              {wizardMode && (
                <div style={{ marginBottom:14,padding:"12px 14px",background:"#e9456011",borderRadius:10,border:"1px solid #e9456033" }}>
                  <div style={{ fontSize:12,fontWeight:700,color:"#e94560",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em" }}>What show?</div>
                  <div style={{ fontSize:12,color:"#aaaabf",lineHeight:1.5 }}>Pick the reality show your league will follow, then name it. You can change the season name later from Settings.</div>
                </div>
              )}
          <Input label="League Name" placeholder={`e.g. Fantasy ${preset?.name || "Show"} ${new Date().getFullYear()}`} value={name} onChange={e=>setName(e.target.value)} />

          <Select label="Show" value={showType} onChange={e=>setShowType(e.target.value)} options={[
            { value:"survivor",label:"Survivor" },{ value:"top_chef",label:"Top Chef" },
            { value:"love_island",label:"Love Island" },{ value:"the_bachelor",label:"The Bachelor/ette" },
            { value:"bake_off",label:"Great British Bake Off" },
            { value:"the_traitors",label:"The Traitors" },{ value:"big_brother",label:"Big Brother" },
            { value:"the_challenge",label:"The Challenge" },{ value:"drag_race",label:"RuPaul's Drag Race" },
            { value:"amazing_race",label:"The Amazing Race" },{ value:"love_is_blind",label:"Love is Blind" },{ value:"custom",label:"Custom Show" },
          ]} />
          {showType === "custom" && <Input label="Show Name" placeholder="e.g. The Traitors" value={showName} onChange={e=>setShowName(e.target.value)} />}
          {/* v2.6.5.0: Season number is a structured int used to key into
              show-wide scoring (showScoring/<showType>/season_<n>/...). Season
              name stays free-text for league branding. */}
          <div style={{ display:"flex",gap:10 }}>
            <div style={{ width:140 }}>
              <Select label="Season #" value={seasonNumber} onChange={e=>{
                const v = e.target.value;
                setSeasonNumber(v);
                if (!seasonName.trim() && v) setSeasonName(`Season ${v}`);
              }} options={[
                { value: "", label: "— Pick —" },
                ...Array.from({length: 60}, (_, i) => ({ value: String(i+1), label: `Season ${i+1}` })),
              ]} />
            </div>
            <div style={{ flex:1 }}>
              <Input label="Season Name" placeholder={seasonNumber ? `Season ${seasonNumber}` : "e.g. Season 47"} value={seasonName} onChange={e=>setSeasonName(e.target.value)} />
            </div>
          </div>

          {wizardMode && (
            <div style={{ marginTop:8 }}>
              <Btn onClick={()=>setSubStep(2)} disabled={!name.trim()} style={{ width:"100%",justifyContent:"center" }}>Next: League Format</Btn>
            </div>
          )}
            </div>
          )}

          {/* SECTION B — format pick + format config */}
          {(!wizardMode || subStep === 2) && (
            <div>
              {wizardMode && (
                <div style={{ marginBottom:14,padding:"12px 14px",background:"#e9456011",borderRadius:10,border:"1px solid #e9456033" }}>
                  <div style={{ fontSize:12,fontWeight:700,color:"#e94560",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em" }}>How do you want to play?</div>
                  <div style={{ fontSize:12,color:"#aaaabf",lineHeight:1.5 }}>Pick a league format. Heroes (recommended for first-timers) gives each player a Hero, Side-Kick, and Vigilantes worth different point multipliers. Read each option's description before choosing — you can't change format after creating.</div>
                </div>
              )}
          <label style={{ display:"block",fontSize:12,color:"#8888aa",marginBottom:8,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em" }}>League Format</label>
          {/* v2.5.0.0: Heroes is the only fully-baked format ready for the
              soft launch. Everything else is hidden until the corresponding
              format-specific UX (Standard snake redraft, Best Ball auto-pick,
              Roto categories, Salary Cap budget, etc.) is hardened. */}
          <div style={{ display:"flex",gap:8,marginBottom:8 }}>
            <button onClick={() => setFormat("captains")} style={{
              padding:"8px 16px",borderRadius:99,cursor:"pointer",whiteSpace:"nowrap",
              background:"#e9456022",border:"1px solid #e9456066",color:"#e94560",
              fontSize:13,fontWeight:700,fontFamily:"'Outfit',sans-serif",flexShrink:0,
            }}>{formatInfo({ episodesPerWeek })["captains"]?.name || "Heroes"}</button>
          </div>
          <div style={{ padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",marginBottom:8 }}>
            <div style={{ color:"#e8e8f0",fontSize:13,lineHeight:1.6 }}>{formatInfo({ episodesPerWeek })["captains"]?.desc}</div>
          </div>
          <div style={{ padding:"10px 14px",background:"#8888aa11",borderRadius:8,border:"1px dashed #2a2a4a",marginBottom:16 }}>
            <div style={{ fontSize:12,color:"#8888aa",lineHeight:1.5 }}>
              More formats coming soon &mdash; Standard snake draft, Best Ball, Categories/Roto, Salary Cap, Survivor Pool, Elimination Pool, and Predictions are all in the pipeline.
            </div>
          </div>

          {/* Format-specific config */}
          {format === "captains" && (
            <div style={{ padding:"14px 16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",marginBottom:16 }}>
              <div style={{ fontSize:12,fontWeight:600,color:"#f5a623",marginBottom:10 }}>HEROES CONFIG</div>
              <Input label="Number of Vigilante Spots" type="number" min="1" max="10" value={regularSlots} onChange={e=>setRegularSlots(e.target.value)} />
              <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",color:"#ccc",fontSize:13,marginTop:4 }}>
                <input type="checkbox" checked={genderedRoster} onChange={e=>setGenderedRoster(e.target.checked)} style={{ accentColor:"#f5a623" }} />
                Require gender minimums (pairs with contestant gender dropdown)
              </label>
              {genderedRoster && (
                <div style={{ marginTop:10 }}>
                  <div style={{ display:"flex",gap:10 }}>
                    <div style={{ flex:1 }}><Input label="Min Male" type="number" min="0" max={Number(regularSlots)+2} value={minMale} onChange={e=>setMinMale(e.target.value)} /></div>
                    <div style={{ flex:1 }}><Input label="Min Female" type="number" min="0" max={Number(regularSlots)+2} value={minFemale} onChange={e=>setMinFemale(e.target.value)} /></div>
                  </div>
                  {(Number(minMale)+Number(minFemale)) > (Number(regularSlots)+2) && (
                    <div style={{ fontSize:11,color:"#e94560",fontWeight:600,marginTop:2 }}>
                      Minimums ({Number(minMale)+Number(minFemale)}) exceed roster size ({Number(regularSlots)+2}). Reduce one before saving.
                    </div>
                  )}
                  <div style={{ fontSize:11,color:"#6a6a8a",marginTop:4,fontStyle:"italic",lineHeight:1.4 }}>
                    Rosters must include at least this many of each gender. Remaining slots can be any gender.
                  </div>
                </div>
              )}
            </div>
          )}
          {format === "standard" && (
            <div style={{ padding:"14px 16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",marginBottom:16 }}>
              <div style={{ fontSize:12,fontWeight:600,color:"#4ecdc4",marginBottom:10 }}>STANDARD CONFIG</div>
              <Input label="Picks Per Manager (per week)" type="number" min="1" max="10" value={picksPerManager} onChange={e=>setPicksPerManager(e.target.value)} />
              <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",color:"#ccc",fontSize:13 }}>
                <input type="checkbox" checked={genderedDraft} onChange={e=>setGenderedDraft(e.target.checked)} style={{ accentColor:"#e94560" }} />
                Gendered draft (equal picks per gender category)
              </label>
            </div>
          )}

          {wizardMode && (
            <div style={{ display:"flex",gap:10,marginTop:8 }}>
              <Btn variant="ghost" onClick={()=>setSubStep(1)} style={{ flex:1,justifyContent:"center" }}>Back</Btn>
              <Btn onClick={()=>setSubStep(3)} style={{ flex:1,justifyContent:"center" }}>Next: Settings</Btn>
            </div>
          )}
            </div>
          )}

          {/* SECTION C — optional settings (episodes/week + h2h + best ball + roto + decimal) */}
          {(!wizardMode || subStep === 3) && (
            <div>
              {wizardMode && (
                <div style={{ marginBottom:14,padding:"12px 14px",background:"#e9456011",borderRadius:10,border:"1px solid #e9456033" }}>
                  <div style={{ fontSize:12,fontWeight:700,color:"#e94560",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em" }}>League settings</div>
                  <div style={{ fontSize:12,color:"#aaaabf",lineHeight:1.5 }}>Optional tweaks. All defaults are fine for a first league — read the descriptions and flip on anything that sounds right. You can change most of these later from Settings.</div>
                </div>
              )}
          <label style={{ display:"block",fontSize:12,color:"#8888aa",marginBottom:8,marginTop:8,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em" }}>League Settings</label>
          <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:16 }}>
            <div style={{ padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
              <Input label="Episodes per Week" type="number" min="1" max="14" value={episodesPerWeek} onChange={e=>setEpisodesPerWeek(e.target.value)} />
              <div style={{ fontSize:11,color:"#6a6a8a",marginTop:4,fontStyle:"italic",lineHeight:1.4 }}>
                Scoring is always per episode. This sets how many episodes air per week — i.e., how often rosters lock and the league advances a week. Set to 1 for most shows (Survivor, Bachelor, Bake Off). Set higher for shows like Love Island (~6) or Big Brother (3) that air multiple episodes per week.
              </div>
            </div>
            {featureFlags?.h2h!==false && (format === "standard" || format === "captains") && (
              <label style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",cursor:"pointer" }}>
                <input type="checkbox" checked={headToHead} onChange={e=>setHeadToHead(e.target.checked)} style={{ accentColor:"#e94560",width:18,height:18 }} />
                <div>
                  <div style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>Head-to-Head Matchups <span style={{ fontSize:10,color:"#f5a623",marginLeft:6,fontWeight:700 }}>PREVIEW</span></div>
                  <div style={{ color:"#6a6a8a",fontSize:11,marginTop:2 }}>{Number(episodesPerWeek) > 1 ? "Per-episode" : "Weekly"} paired matchups. W/L record determines standings instead of total points.</div>
                </div>
              </label>
            )}
            {featureFlags?.best_ball!==false && format === "captains" && (
              <label style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",cursor:"pointer" }}>
                <input type="checkbox" checked={bestBall} onChange={e=>setBestBall(e.target.checked)} style={{ accentColor:"#e94560",width:18,height:18 }} />
                <div>
                  <div style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>Best Ball <span style={{ fontSize:10,color:"#f5a623",marginLeft:6,fontWeight:700 }}>PREVIEW</span></div>
                  <div style={{ color:"#6a6a8a",fontSize:11,marginTop:2 }}>Auto-optimizes your lineup each {Number(episodesPerWeek) > 1 ? "episode" : "week"}. No roster management needed — just draft well.</div>
                </div>
              </label>
            )}
            {featureFlags?.roto!==false && (format === "standard" || format === "captains") && (
              <label style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",cursor:"pointer" }}>
                <input type="checkbox" checked={rotoScoring} onChange={e=>setRotoScoring(e.target.checked)} style={{ accentColor:"#e94560",width:18,height:18 }} />
                <div>
                  <div style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>Categories / Roto <span style={{ fontSize:10,color:"#f5a623",marginLeft:6,fontWeight:700 }}>PREVIEW</span></div>
                  <div style={{ color:"#6a6a8a",fontSize:11,marginTop:2 }}>Rank teams by scoring category (most challenge wins, fewest penalties, etc). Best cumulative rank wins.</div>
                </div>
              </label>
            )}
            <label style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",cursor:"pointer" }}>
              <input type="checkbox" checked={decimalScoring} onChange={e=>setDecimalScoring(e.target.checked)} style={{ accentColor:"#e94560",width:18,height:18 }} />
              <div>
                <div style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>Decimal Scoring</div>
                <div style={{ color:"#6a6a8a",fontSize:11,marginTop:2 }}>Show scores to two decimal places (e.g. 66.80 instead of 67). Turn off for whole numbers only.</div>
              </div>
            </label>
          </div>

          {wizardMode ? (
            <div style={{ display:"flex",gap:10 }}>
              <Btn variant="ghost" onClick={()=>setSubStep(2)} style={{ flex:1,justifyContent:"center" }}>Back</Btn>
              <Btn onClick={()=>{ setStep(2); setSubStep(1); }} disabled={!name.trim()} style={{ flex:1,justifyContent:"center" }}>Next: Scoring Rules</Btn>
            </div>
          ) : (
            <Btn onClick={()=>setStep(2)} disabled={!name.trim()} style={{ width:"100%",justifyContent:"center" }}>Next: Scoring Rules</Btn>
          )}
            </div>
          )}
        </div>
      )}

      {/* ─── STEP 2: SCORING ─── */}
      {step === 2 && (
        <div>
          <div style={{ fontSize:13,color:"#6a6a8a",marginBottom:16,lineHeight:1.5 }}>
            Pre-loaded from the <strong style={{color:"#e8e8f0"}}>{preset?.name||"Custom"}</strong> template. Toggle rules on/off, adjust points, or add your own.
          </div>

          {/* Existing rules grouped by category */}
          {(()=>{
            const cats = {};
            scoringRules.forEach(r => { const c = r.category||"Other"; if(!cats[c]) cats[c]=[]; cats[c].push(r); });
            // Also show template rules not yet added
            const templateRules = DEFAULT_SCORING_RULES.filter(r => preset?.scoringDefaults?.includes(r.id));
            templateRules.forEach(r => { if (!scoringRules.some(sr=>sr.id===r.id)) { const c = r.category||"Other"; if(!cats[c]) cats[c]=[]; cats[c].push({...r, _inactive: true}); }});
            return Object.entries(cats).map(([cat, rules]) => (
              <div key={cat} style={{ marginBottom:16 }}>
                <div style={{ fontSize:11,fontWeight:700,color:"#6a6a8a",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6 }}>{cat}</div>
                <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                  {rules.map(r => {
                    const active = !r._inactive;
                    const current = scoringRules.find(sr=>sr.id===r.id);
                    return (
                      <div key={r.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,
                        background:active?"#12121f":"#0d0d18",border:active?"1px solid #1e1e38":"1px solid #1a1a2a",opacity:active?1:0.5 }}>
                        <input type="checkbox" checked={active} onChange={()=>toggleRule(r.id)} style={{ accentColor:"#e94560",width:16,height:16,flexShrink:0 }} />
                        <div style={{ flex:1,fontSize:13,color:"#e8e8f0",fontWeight:active?600:400 }}>{r.label}</div>
                        {active && (
                          <>
                            <input type="number" value={current?.points||r.points} onChange={e=>updateRulePoints(r.id,e.target.value)}
                              style={{ width:60,padding:"4px 8px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
                                color:(current?.points||r.points)>=0?"#4ecdc4":"#e94560",fontSize:13,fontWeight:700,textAlign:"center",fontFamily:"'Outfit',sans-serif" }} />
                            <button onClick={()=>setScoringRules(scoringRules.filter(sr=>sr.id!==r.id))} style={{
                              background:"none",border:"none",color:"#4a4a6a",cursor:"pointer",padding:2,fontSize:14 }}>x</button>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}

          {/* Add custom rule */}
          <div style={{ padding:"14px 16px",background:"#0d0d18",borderRadius:12,border:"1px dashed #2a2a4a",marginBottom:16 }}>
            <div style={{ fontSize:13,fontWeight:700,color:"#f0f0f5",marginBottom:10 }}>Add Custom Rule</div>
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              <div style={{ flex:"2 1 140px" }}>
                <Input label="Rule Name" placeholder='e.g. "Won a bet"' value={newRuleName} onChange={e=>setNewRuleName(e.target.value)} />
              </div>
              <div style={{ flex:"1 1 70px" }}>
                <Input label="Points" type="number" placeholder="5" value={newRulePoints} onChange={e=>setNewRulePoints(e.target.value)} />
              </div>
            </div>
            <div style={{ display:"flex",gap:8,alignItems:"flex-end" }}>
              <div style={{ flex:1 }}>
                <label style={{ display:"block",fontSize:12,color:"#8888aa",marginBottom:5,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em" }}>Category</label>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:8 }}>
                  {(()=>{
                    const existingCats = [...new Set(scoringRules.map(r=>r.category||"Other"))];
                    if (newRuleCategory && !existingCats.includes(newRuleCategory)) existingCats.push(newRuleCategory);
                    return existingCats.map(c => (
                      <button key={c} onClick={()=>setNewRuleCategory(c)} style={{
                        padding:"5px 12px",borderRadius:99,fontSize:11,fontWeight:600,cursor:"pointer",
                        background:newRuleCategory===c?"#e9456022":"transparent",
                        border:newRuleCategory===c?"1px solid #e9456066":"1px solid #2a2a4a",
                        color:newRuleCategory===c?"#e94560":"#7a7a9a",fontFamily:"'Outfit',sans-serif",
                      }}>{c}</button>
                    ));
                  })()}
                </div>
                <Input label="Or create new category" placeholder="e.g. Social" value={customCategory} onChange={e=>{setCustomCategory(e.target.value);if(e.target.value) setNewRuleCategory(e.target.value)}} />
              </div>
            </div>
            <Btn small onClick={()=>{
              if (!newRuleName.trim()) return;
              const id = newRuleName.trim().toLowerCase().replace(/[^a-z0-9]+/g,"_");
              const rule = { id, label: newRuleName.trim(), points: Number(newRulePoints)||0, category: newRuleCategory || "Custom" };
              setScoringRules([...scoringRules, rule]);
              setNewRuleName("");
              setNewRulePoints("");
              setCustomCategory("");
            }} disabled={!newRuleName.trim()}>Add Rule</Btn>
          </div>

          <div style={{ display:"flex",gap:10,marginTop:20 }}>
            <Btn variant="ghost" onClick={()=>{ setStep(1); setSubStep(wizardMode ? 3 : 1); }} style={{ flex:1,justifyContent:"center" }}>Back</Btn>
            <Btn onClick={()=>setStep(3)} style={{ flex:1,justifyContent:"center" }}>Next: Teams</Btn>
          </div>
        </div>
      )}

      {/* ─── STEP 3: TEAMS ─── */}
      {step === 3 && (
        <div>
          <div style={{ fontSize:13,color:"#6a6a8a",marginBottom:16,lineHeight:1.5 }}>
            Add teams now, or skip and add them later. You can generate invite codes after creation.
          </div>

          {teams.length > 0 && (
            <div style={{ display:"flex",flexDirection:"column",gap:6,marginBottom:16 }}>
              {teams.map(t => (
                <div key={t.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#12121f",borderRadius:8,border:"1px solid #1e1e38" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13,fontWeight:600,color:"#e8e8f0" }}>{t.name}</div>
                    <div style={{ fontSize:11,color:"#6a6a8a" }}>{t.owner}</div>
                  </div>
                  <button onClick={()=>removeTeam(t.id)} style={{ background:"none",border:"none",color:"#e94560",cursor:"pointer",fontSize:12,fontFamily:"'Outfit',sans-serif" }}>Remove</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ padding:"14px 16px",background:"#0d0d18",borderRadius:10,border:"1px solid #1e1e38",marginBottom:16 }}>
            <div style={{ display:"flex",gap:8,marginBottom:8 }}>
              <div style={{ flex:1 }}>
                <Input label="Team Name" placeholder="e.g. Team Scott" value={newTeamName} onChange={e=>setNewTeamName(e.target.value)} />
              </div>
              <div style={{ flex:1 }}>
                <Input label="Owner Name" placeholder="e.g. Scott" value={newTeamOwner} onChange={e=>setNewTeamOwner(e.target.value)} />
              </div>
            </div>
            <Btn small variant="secondary" onClick={addTeam} disabled={!newTeamName.trim()}>Add Team</Btn>
          </div>

          <div style={{ padding:"14px 16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",marginBottom:20 }}>
            <div style={{ fontSize:13,fontWeight:600,color:"#f0f0f5",marginBottom:6 }}>League Summary</div>
            <div style={{ fontSize:12,color:"#6a6a8a",lineHeight:1.6 }}>
              <div>{name || "Untitled"} · {preset?.name||showName||"Custom"} · {seasonName||"Season 1"}</div>
              <div>{formatInfo({ episodesPerWeek })[format]?.name} format · {scoringRules.length} scoring rules · {teams.length} team{teams.length!==1?"s":""}</div>
              {headToHead && <div style={{color:"#f5a623"}}>Head-to-Head matchups enabled</div>}
              {bestBall && <div style={{color:"#4ecdc4"}}>Best Ball enabled</div>}
              {rotoScoring && <div style={{color:"#9d5dff"}}>Categories/Roto scoring enabled</div>}
            </div>
          </div>

          <div style={{ display:"flex",gap:10 }}>
            <Btn variant="ghost" onClick={()=>setStep(2)} style={{ flex:1,justifyContent:"center" }}>Back</Btn>
            <Btn onClick={handleSave} disabled={!name.trim()} style={{ flex:1,justifyContent:"center" }}>Create League</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LEAGUE DASHBOARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// v2.6.1.0: Per-league activity log, accessible to ALL league members (not
// just commissioners). Renders league.auditLog newest-first with timestamps.
// Entries are appended by writes elsewhere via appendAudit(). The visibility
// is the whole point — managers can see if a commissioner edited someone's
// roster while it was supposed to be locked.
function LeagueActivityTab({ league }) {
  const log = Array.isArray(league?.auditLog) ? league.auditLog : [];
  if (log.length === 0) {
    return <EmptyState message="No activity recorded yet. As league members make changes (roster edits, scoring, lock toggles), they'll show up here for everyone to see." />;
  }
  function fmtTime(t) {
    if (!t) return "";
    const d = new Date(t);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    if (sameDay) return `Today ${time}`;
    if (isYesterday) return `Yesterday ${time}`;
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
  }
  function dotColor(type) {
    if (type === "roster-locked") return "#e94560"; // commissioner-while-locked → red flag
    if (type === "roster") return "#4ecdc4";
    if (type === "lock") return "#f5a623";
    if (type === "scoring") return "#9d5dff";
    if (type === "finalize") return "#4d8aff";
    return "#8888aa";
  }
  return (
    <div>
      <div style={{ fontSize:13,color:"#6a6a8a",marginBottom:16,lineHeight:1.5 }}>
        Recent league activity. Roster edits, scoring updates, lock changes, and finalize actions are all logged. Visible to every league member.
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
        {log.map((e, i) => {
          const flagged = e.type === "roster-locked" || e.meta?.byCommissioner;
          return (
            <div key={i} style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",borderRadius:8,
              background:flagged?"#e9456011":"#12121f",border:flagged?"1px solid #e9456033":"1px solid #1e1e38" }}>
              <div style={{ width:8,height:8,borderRadius:"50%",flexShrink:0,marginTop:5,background:dotColor(e.type) }}/>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:13,color:"#e8e8f0",lineHeight:1.4 }}>{e.desc}</div>
                <div style={{ fontSize:11,color:"#6a6a8a",marginTop:2 }}>{fmtTime(e.time)}</div>
              </div>
              {flagged && <Badge color="#e94560">FLAGGED</Badge>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeagueDashboard({ league, onUpdate, onBack, loggedInTeamId, isCommissioner, allLeagues, userProfile, onRevealSpoiler }) {
  const [tab, setTab] = useState("standings");
  const [modal, setModal] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const standings = useMemo(() => calcStandings(league), [league]);

  const currentWeek = league.currentWeek || 1;
  // Scan all weekStatus entries — fixes bug where blur dropped after the
  // commissioner advanced the week pointer past a still-in-grace week.
  const activeSpoilerWeek = useMemo(
    () => getActiveSpoilerWeek(league, userProfile),
    [league, userProfile]
  );
  const spoilerActive = activeSpoilerWeek != null;
  const spoilerWeek = activeSpoilerWeek ?? currentWeek;
  const handleReveal = () => onRevealSpoiler?.(league.id, spoilerWeek);

  const allTabs = [
    { id:"standings",label:"Standings",icon:"trophy",access:"all" },
    { id:"contestants",label:"Cast",icon:"star",access:"all" },
    { id:"scoring",label:"Scoring",icon:"chart",access:"all" },
    ...(league.format === "standard" ? [{ id:"weekly-draft",label:"Draft",icon:"grid",access:"commissioner" }] : []),
    ...(league.format === "captains" ? [{ id:"depth-chart",label:"My Roster",icon:"crown",access:"all" }] : []),
    ...(league.format === "survivor_pool" ? [{ id:"my-pick",label:"My Pick",icon:"star",access:"all" }] : []),
    ...(league.format === "elimination_pool" ? [{ id:"weekly-pick",label:effectiveEpisodesPerWeek(league) > 1 ? "Episode Pick" : "Weekly Pick",icon:"star",access:"all" }] : []),
    ...(league.format === "salary_cap" ? [
      { id:"my-roster-cap",label:"My Roster",icon:"crown",access:"all" },
      { id:"set-prices",label:"Prices",icon:"settings",access:"commissioner" },
    ] : []),
    ...(league.format === "predictions" ? [
      { id:"predict",label:"Predict",icon:"star",access:"all" },
      { id:"manage-questions",label:"Questions",icon:"settings",access:"commissioner" },
    ] : []),
    { id:"activity",label:"Activity",icon:"clock",access:"all" },
    { id:"settings",label:"Settings",icon:"settings",access:"commissioner" },
  ];

  const tabs = allTabs.filter(t => t.access === "all" || isCommissioner);
  const loggedInTeam = (league.teams||[]).find(t=>t.id===loggedInTeamId);

  return (
    <div>
      <div style={{ padding:"18px 20px 14px",background:"linear-gradient(180deg,rgba(233,69,96,0.04),transparent)",borderBottom:"1px solid #1e1e38" }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <button onClick={onBack} style={{ background:"#12121f",border:"1px solid #1e1e38",borderRadius:8,color:"#8888aa",cursor:"pointer",padding:6,display:"flex",alignItems:"center",justifyContent:"center" }}><Icon name="back" size={18}/></button>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ display:"flex",alignItems:"center",gap:8 }}>
              <span style={{ fontFamily:"'Anybody',sans-serif",fontSize:13,fontWeight:900,
                color:SHOW_PRESETS[league.showType]?.color||"#9d5dff",
                background:(SHOW_PRESETS[league.showType]?.color||"#9d5dff")+"18",
                padding:"3px 8px",borderRadius:6 }}>{SHOW_PRESETS[league.showType]?.emoji||"TV"}</span>
              <div style={{ color:"#e8e8f0",fontWeight:800,fontSize:17,fontFamily:"'Anybody',sans-serif",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{league.name}</div>
            </div>
            <div style={{ color:"#6a6a8a",fontSize:11,marginTop:3,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap" }}>
              <span>{league.seasonName}</span>
              <span style={{ width:3,height:3,borderRadius:"50%",background:"#3a3a5a" }}></span>
              <span>{formatInfo(league)[league.format]?.name}</span>
              <span style={{ width:3,height:3,borderRadius:"50%",background:"#3a3a5a" }}></span>
              <span>{cadenceLabel(league, league.currentWeek)}</span>
            </div>
          </div>
          <div style={{ textAlign:"right",flexShrink:0 }}>
            <div style={{ color:"#e8e8f0",fontSize:12,fontWeight:600 }}>{loggedInTeam?.owner || "—"}</div>
            <div style={{ fontSize:10,color:isCommissioner?"#f5a623":"#6a6a8a",fontWeight:600 }}>
              {isCommissioner ? "★ Commissioner" : "Manager"}
            </div>
          </div>
        </div>
      </div>

      <div style={{ height:3,background:"#1e1e38",margin:"0 20px" }}>
        <div style={{ height:"100%",borderRadius:2,background:"linear-gradient(90deg,#e94560,#f5a623)",
          width: Math.min(100, ((league.currentWeek||1) / Math.max(Object.keys(league.weeklyScores||{}).length, league.currentWeek||1, 10)) * 100) + "%",
          transition:"width 0.5s ease" }}></div>
      </div>
      <div style={{ display:"flex",overflowX:"auto",padding:"8px 12px",gap:4,borderBottom:"1px solid #1e1e38",WebkitOverflowScrolling:"touch" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background:tab===t.id?"#e9456022":"transparent",border:tab===t.id?"1px solid #e9456044":"1px solid transparent",
            cursor:"pointer",padding:"8px 14px",fontSize:12,fontWeight:tab===t.id?700:500,borderRadius:99,
            color:tab===t.id?"#e94560":"#7a7a9a",
            display:"flex",alignItems:"center",gap:5,whiteSpace:"nowrap",fontFamily:"'Outfit',sans-serif",transition:"all 0.15s ease",
          }}>
            <Icon name={t.icon} size={12}/> {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:20 }}>
        {tab === "standings" && <SpoilerBlur active={spoilerActive} onReveal={handleReveal} week={spoilerWeek} league={league}><StandingsTab league={league} standings={standings} onUpdate={onUpdate} isCommissioner={isCommissioner} myTeamId={loggedInTeamId} /></SpoilerBlur>}
        {tab === "contestants" && <SpoilerBlur active={spoilerActive} onReveal={handleReveal} week={spoilerWeek} league={league}><ContestantsTab league={league} onUpdate={isCommissioner?onUpdate:null} setModal={isCommissioner?setModal:()=>{}} setEditing={isCommissioner?setEditingItem:()=>{}} readOnly={!isCommissioner} /></SpoilerBlur>}
        {tab === "scoring" && <SpoilerBlur active={spoilerActive} onReveal={handleReveal} week={spoilerWeek} league={league}><ScoringTab league={league} onUpdate={isCommissioner ? onUpdate : null} isCommissioner={isCommissioner} userProfile={userProfile} /></SpoilerBlur>}
        {tab === "weekly-draft" && isCommissioner && <WeeklyDraftTab league={league} onUpdate={onUpdate} standings={standings} />}
        {tab === "depth-chart" && <DepthChartTab league={league} onUpdate={onUpdate} lockedToTeamId={isCommissioner ? null : loggedInTeamId} defaultTeamId={loggedInTeamId} isCommissioner={isCommissioner} spoilerActive={spoilerActive} myTeamId={loggedInTeamId} userProfile={userProfile} />}
        {tab === "my-pick" && <SpoilerBlur active={spoilerActive} onReveal={handleReveal} week={spoilerWeek} league={league}><SurvivorPoolTab league={league} onUpdate={onUpdate} loggedInTeamId={loggedInTeamId} isCommissioner={isCommissioner} /></SpoilerBlur>}
        {tab === "weekly-pick" && <SpoilerBlur active={spoilerActive} onReveal={handleReveal} week={spoilerWeek} league={league}><EliminationPoolTab league={league} onUpdate={onUpdate} loggedInTeamId={loggedInTeamId} isCommissioner={isCommissioner} /></SpoilerBlur>}
        {tab === "my-roster-cap" && <SpoilerBlur active={spoilerActive} onReveal={handleReveal} week={spoilerWeek} league={league}><SalaryCapRosterTab league={league} onUpdate={onUpdate} loggedInTeamId={loggedInTeamId} isCommissioner={isCommissioner} /></SpoilerBlur>}
        {tab === "set-prices" && isCommissioner && <SalaryCapPricesTab league={league} onUpdate={onUpdate} />}
        {tab === "predict" && <SpoilerBlur active={spoilerActive} onReveal={handleReveal} week={spoilerWeek} league={league}><PredictionsPlayerTab league={league} onUpdate={onUpdate} loggedInTeamId={loggedInTeamId} /></SpoilerBlur>}
        {tab === "manage-questions" && isCommissioner && <PredictionsCommishTab league={league} onUpdate={onUpdate} />}
        {tab === "activity" && <LeagueActivityTab league={league} />}
        {tab === "settings" && isCommissioner && <SettingsTab league={league} onUpdate={onUpdate} allLeagues={allLeagues} setModal={setModal} setEditing={setEditingItem} userProfile={userProfile} />}
      </div>

      {isCommissioner && (
        <>
          <AddContestantModal open={modal==="add-contestant"} onClose={()=>{setModal(null);setEditingItem(null)}}
            league={league} onUpdate={onUpdate} editing={editingItem} />
          <AddTeamModal open={modal==="add-team"} onClose={()=>{setModal(null);setEditingItem(null)}}
            league={league} onUpdate={onUpdate} editing={editingItem} />
        </>
      )}
    </div>
  );
}

// ─── Login Screen ───
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STANDINGS TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function StandingsTab({ league, standings, onUpdate, isCommissioner, myTeamId }) {
  const weeks = Object.keys(league.weeklyScores || {}).sort((a,b)=>+a - +b);
  const [expanded, setExpanded] = useState(null);
  // teamModalId: when set, render <TeamProfileModal> for that team. Driven by
  // clicks on the team avatar (in either the collapsed row or the expanded
  // header). The row-expand toggle is unaffected because the avatar's onClick
  // calls stopPropagation.
  const [teamModalId, setTeamModalId] = useState(null);
  const teamModalTeam = teamModalId ? (league.teams||[]).find(t => t.id === teamModalId) : null;
  // lightboxContestantId: opens the shared ContestantPhotoLightbox (the same
  // fullscreen photo+bio modal that the Cast tab's contestant avatar uses).
  // Driven by clicks on contestant names anywhere in this tab.
  const [lightboxContestantId, setLightboxContestantId] = useState(null);
  const lightboxContestant = lightboxContestantId ? (league.contestants||[]).find(c => c.id === lightboxContestantId) : null;
  const openContestant = (id) => { if (id) setLightboxContestantId(id); };
  // Per-team + league-wide records. Single-pass scan of league.weeklyScores,
  // memoized so the records panel and per-team card don't recompute on every
  // expand/collapse toggle. See computeLeagueRecords at module scope.
  const records = useMemo(() => computeLeagueRecords(league, standings), [league, standings]);
  // Global week selector — controls what week the expanded roster breakdown shows.
  // Includes a "season" option that sums all weeks. Standings rankings themselves
  // continue to use season totals (unchanged); the selector only affects expanded
  // roster scoring detail.
  const [viewWeek, setViewWeek] = useState(String(league.currentWeek || 1));
  const weekOpts = [
    ...Array.from({length:Math.max(league.currentWeek||1,1)},(_,i)=>({value:String(i+1),label:cadenceLabel(league, i+1)})),
    { value:"season", label:"Season Total" },
  ];

  function getTeamRosterForWeek(team, weekNum) {
    if (league.format === "captains") {
      const dc = (weekNum === "season")
        ? (team.depthChart || {})
        : (team.weeklyDepthCharts?.[weekNum] || team.depthChart || {});
      const parts = [];
      if (dc.captain) { const c = (league.contestants||[]).find(x=>x.id===dc.captain); if(c) parts.push({ ...c, role:"captain", multiplier:2 }); }
      if (dc.coCaptain) { const c = (league.contestants||[]).find(x=>x.id===dc.coCaptain); if(c) parts.push({ ...c, role:"coCaptain", multiplier:1.5 }); }
      (dc.regulars||[]).forEach(rid => { const c = (league.contestants||[]).find(x=>x.id===rid); if(c) parts.push({ ...c, role:"regular", multiplier:1 }); });
      return parts;
    }
    const wr = team.weeklyRosters?.[weekNum] || [];
    return wr.map(id => (league.contestants||[]).find(c=>c.id===id)).filter(Boolean).map(c=>({...c,role:"regular",multiplier:1}));
  }

  function getContestantWeekPts(contestantId, weekNum) {
    if (weekNum === "season") return weeks.reduce((s,w) => s + calcContestantWeekPoints(league.weeklyScores?.[w]||{}, contestantId), 0);
    return calcContestantWeekPoints(league.weeklyScores?.[weekNum]||{}, contestantId);
  }

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8 }}>
        <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>Leaderboard</h3>
        <Badge color="#f5a623">{cadenceLabel(league, league.currentWeek)}</Badge>
      </div>
      {standings.length > 0 && weeks.length > 0 && (() => {
        const lr = records.league;
        const teamNameOf = id => (league.teams||[]).find(t => t.id === id)?.name || "—";
        const contestantNameOf = id => (league.contestants||[]).find(c => c.id === id)?.name || "—";
        const items = [
          { label:"Single-Week Ceiling", val: lr.weekCeiling ? `+${formatPts(Math.round(lr.weekCeiling.pts*10)/10, league)}` : "—", sub: lr.weekCeiling ? `${teamNameOf(lr.weekCeiling.teamId)} · ${cadenceShort(league)} ${lr.weekCeiling.wk}` : "—", color:"#4ecdc4", desc:"Highest single-week team total in the league" },
          { label:"Single-Week Floor",   val: lr.weekFloor   ? formatPts(Math.round(lr.weekFloor.pts*10)/10, league) : "—",       sub: lr.weekFloor   ? `${teamNameOf(lr.weekFloor.teamId)} · ${cadenceShort(league)} ${lr.weekFloor.wk}` : "—",     color:"#e94560", desc:"Lowest single-week team total in the league" },
          { label:"League MVP",          val: lr.mvp         ? `+${formatPts(Math.round(lr.mvp.pts*10)/10, league)}`         : "—", sub: lr.mvp ? contestantNameOf(lr.mvp.id) : "—", color:"#f5a623", cid: lr.mvp?.id, desc:"Highest-scoring contestant overall, league-wide" },
          { label:"Wooden Spoon",        val: lr.woodenSpoon ? formatPts(Math.round(lr.woodenSpoon.pts*10)/10, league)        : "—", sub: lr.woodenSpoon ? contestantNameOf(lr.woodenSpoon.id) : "—", color:"#e94560", cid: lr.woodenSpoon?.id, desc:"Lowest-scoring contestant overall (last-place award)" },
          { label:"Biggest Comeback",    val: lr.comeback    ? `+${formatPts(Math.round(lr.comeback.swing*10)/10, league)}`   : "—", sub: lr.comeback    ? `${teamNameOf(lr.comeback.teamId)} · ${cadenceShort(league)} ${lr.comeback.wk}` : "—", color:"#4ecdc4", desc:"Largest single-week jump up vs the prior week" },
          { label:"Biggest Choke",       val: lr.choke       ? formatPts(Math.round(lr.choke.swing*10)/10, league)            : "—", sub: lr.choke       ? `${teamNameOf(lr.choke.teamId)} · ${cadenceShort(league)} ${lr.choke.wk}` : "—",       color:"#e94560", desc:"Largest single-week drop vs the prior week" },
          { label:"Most Consistent",     val: lr.mostConsistent ? `±${formatPts(Math.round(lr.mostConsistent.sd*10)/10, league)}` : "—", sub: lr.mostConsistent ? teamNameOf(lr.mostConsistent.teamId) : "—", color:"#9d5dff", desc:"Team with the smallest week-to-week swing (lowest stddev)" },
          { label:"Most Volatile",       val: lr.mostVolatile   ? `±${formatPts(Math.round(lr.mostVolatile.sd*10)/10, league)}`   : "—", sub: lr.mostVolatile   ? teamNameOf(lr.mostVolatile.teamId) : "—",   color:"#ff8a3d", desc:"Team with the biggest week-to-week swings (highest stddev)" },
        ];
        return (
          <details style={{ marginBottom:16 }}>
            <summary style={{ cursor:"pointer",padding:"10px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",fontSize:13,fontWeight:700,color:"#e8e8f0",display:"flex",alignItems:"center",justifyContent:"space-between",listStyle:"none" }}>
              <span>Recordbook</span>
              <span style={{ fontSize:11,fontWeight:500,color:"#6a6a8a" }}>{items.length} records · tap to {/* CSS-only: arrow flips via summary marker would need pseudo */}expand</span>
            </summary>
            <div style={{ marginTop:6,display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(170px, 1fr))",gap:6 }}>
              {items.map(it => (
                <div key={it.label} onClick={it.cid ? ()=>openContestant(it.cid) : undefined}
                  style={{ padding:"10px 12px",background:"#0d0d18",borderRadius:8,border:"1px solid #1e1e38",cursor:it.cid?"pointer":"default" }}>
                  <div style={{ fontSize:9,fontWeight:700,color:"#6a6a8a",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:3 }}>{it.label}</div>
                  <div style={{ fontSize:16,fontWeight:800,fontFamily:"'Anybody',sans-serif",color:it.color,lineHeight:1 }}>{it.val}</div>
                  <div style={{ fontSize:10,color:"#8888aa",marginTop:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{it.sub}</div>
                  {it.desc && <div style={{ fontSize:9,color:"#4a4a6a",marginTop:4,fontStyle:"italic",lineHeight:1.3 }}>{it.desc}</div>}
                </div>
              ))}
            </div>
          </details>
        );
      })()}
      {standings.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <Select label="Roster Breakdown Period" value={viewWeek} onChange={e=>setViewWeek(e.target.value)} options={weekOpts} />
        </div>
      )}
      {standings.length === 0 ? <EmptyState message={`Add teams in Settings → Invite & Teams and score ${cadenceWord(league).toLowerCase()}s to see standings.`} /> : (
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {standings.map((team,i) => {
            const lastWk = weeks[weeks.length-1];
            const wkPts = lastWk ? (team.weeklyTotals?.[lastWk]||0) : 0;
            const isExp = expanded === team.id;
            const roster = isExp ? getTeamRosterForWeek(team, viewWeek) : [];
            const periodLabel = viewWeek === "season" ? "Season" : cadenceLabel(league, viewWeek);
            const periodTotal = isExp ? (viewWeek === "season"
              ? weeks.reduce((s,w) => s + calcTeamWeekPoints(league, team, w), 0)
              : calcTeamWeekPoints(league, team, viewWeek)
            ) : 0;
            return (
              <div key={team.id} style={{
                overflow:"hidden",borderRadius:12,
                background:i===0?"linear-gradient(135deg,rgba(255,77,106,0.1),rgba(255,210,61,0.05))":i===1?"linear-gradient(135deg,rgba(200,200,220,0.06),transparent)":i===2?"linear-gradient(135deg,rgba(205,127,50,0.06),transparent)":"#12121f",
                border:i===0?"1px solid rgba(255,77,106,0.25)":i<3?"1px solid rgba(200,200,220,0.1)":"1px solid #1e1e38",
                transition:"all 0.2s",
              }}>
                <div style={{ display:"flex",alignItems:"center",gap:12,padding:"16px",cursor:"pointer" }} onClick={()=>setExpanded(isExp?null:team.id)}>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <div style={{ fontSize:i<3?22:14,width:28,textAlign:"center",flexShrink:0,
                    fontFamily:"'Anybody',sans-serif",fontWeight:800,
                    color:i===0?"#ff4d6a":i===1?"#c0c0d0":i===2?"#cd7f32":"#4a4a6a" }}>
                    {i===0?"🥇":i===1?"🥈":i===2?"🥉":(i+1)}
                  </div>
                  {team.teamAvatar ? (
                    <img src={team.teamAvatar} alt={team.name}
                      onClick={e=>{ e.stopPropagation(); setTeamModalId(team.id); }}
                      title="View team profile"
                      style={{ width:40,height:40,borderRadius:12,objectFit:"cover",border:"2px solid "+(team.teamColor||"#e94560"),flexShrink:0,cursor:"pointer" }} />
                  ) : (
                    <div onClick={e=>{ e.stopPropagation(); setTeamModalId(team.id); }} title="View team profile"
                      style={{ width:40,height:40,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",
                      background:team.teamColor||"#1a1a2e",fontSize:16,fontWeight:800,color:"#fff",
                      fontFamily:"'Anybody',sans-serif",flexShrink:0,cursor:"pointer",
                    }}>{team.name?.[0]}</div>
                  )}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ color:"#e8e8f0",fontWeight:700,fontSize:14 }}>{team.name}</div>
                  <div style={{ color:"#6a6a8a",fontSize:11,marginTop:2 }}>{team.owner}{team.h2hRecord ? ` · ${team.h2hRecord}` : ""}{wkPts !== 0 ? ` · ${wkPts>0?"+":""}${formatPts(wkPts, league)} this wk` : ""}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  {team.h2hRecord ? (
                    <>
                      <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:20,fontWeight:900,color:"#e8e8f0",letterSpacing:"-0.02em" }}>{team.h2hRecord}</div>
                      <div style={{ fontSize:10,color:"#4a4a6a" }}>{formatPts(team.total, league)} pts</div>
                    </>
                  ) : team.roto ? (
                    <>
                      <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:20,fontWeight:900,color:"#9d5dff",letterSpacing:"-0.02em" }}>{formatPts(team.rotoTotal, league)}</div>
                      <div style={{ fontSize:10,color:"#4a4a6a" }}>roto pts</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:24,fontWeight:900,color:team.total>0?"#e8e8f0":team.total<0?"#e94560":"#6a6a8a",letterSpacing:"-0.02em" }}>{formatPts(team.total, league)}</div>
                      <div style={{ fontSize:10,color:"#4a4a6a" }}>pts</div>
                    </>
                  )}
                </div>
                <div style={{ transform:isExp?"rotate(90deg)":"none",transition:"transform 0.15s ease",color:"#6a6a8a",flexShrink:0 }}><Icon name="chevron" size={16}/></div>
                </div>
                {isExp && (
                  <div style={{ padding:"0 16px 16px",borderTop:"1px solid #1e1e38" }}>
                    {/* Period header strip — period label, period total, roster count */}
                    <div style={{ paddingTop:12,paddingBottom:10,display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:10,flexWrap:"wrap" }}>
                      <div style={{ fontSize:11,fontWeight:700,color:"#6a6a8a",textTransform:"uppercase",letterSpacing:"0.05em" }}>
                        {periodLabel} · {league.format==="captains"?"Depth Chart":"Roster"} ({roster.length})
                      </div>
                      <div style={{ fontSize:20,fontWeight:900,fontFamily:"'Anybody',sans-serif",color:periodTotal>0?"#4ecdc4":periodTotal<0?"#e94560":"#6a6a8a",letterSpacing:"-0.02em",lineHeight:1 }}>
                        {formatPts(Math.round(periodTotal*10)/10, league)}
                      </div>
                    </div>
                    {/* Team Records — per-team awards. Reads from the precomputed `records.perTeam[team.id]` */}
                    {(() => {
                      const tr = records.perTeam[team.id];
                      if (!tr || weeks.length === 0) return null;
                      const byId = id => (league.contestants||[]).find(c => c.id === id);
                      const nameOf = id => byId(id)?.name || "—";
                      const cells = [
                        { label:"Star Player", val:tr.starPlayer ? formatPts(Math.round(tr.starPlayer.pts*10)/10, league) : "—", sub:tr.starPlayer ? nameOf(tr.starPlayer.id) : "no contributions", color:"#4ecdc4", cid: tr.starPlayer?.id, desc:"Most points contributed to this team (multiplier applied)" },
                        { label:"Bench Warmer", val:tr.benchWarmer ? formatPts(Math.round(tr.benchWarmer.pts*10)/10, league) : "—", sub:tr.benchWarmer ? nameOf(tr.benchWarmer.id) : "—", color:"#e94560", cid: tr.benchWarmer?.id, desc:"Fewest points contributed (least valuable pick)" },
                        { label:"Big Hit", val:tr.bigHit ? `+${formatPts(Math.round(tr.bigHit.pts*10)/10, league)}` : "—", sub:tr.bigHit ? `${nameOf(tr.bigHit.id)} · ${cadenceShort(league)} ${tr.bigHit.wk}` : "—", color:"#f5a623", cid: tr.bigHit?.id, desc:"Highest single-week score from any rostered contestant" },
                        { label:"Big Miss", val:tr.bigMiss ? formatPts(Math.round(tr.bigMiss.pts*10)/10, league) : "—", sub:tr.bigMiss ? `${nameOf(tr.bigMiss.id)} · ${cadenceShort(league)} ${tr.bigMiss.wk}` : "—", color:"#e94560", cid: tr.bigMiss?.id, desc:"Lowest single-week score from any rostered contestant" },
                        { label:"Hot Streak", val:tr.hotStreak > 0 ? `${tr.hotStreak} ${cadenceShort(league).toLowerCase()}${tr.hotStreak===1?"":"s"}` : "—", sub:"positive run", color:"#ff8a3d", desc:"Longest consecutive run of positive-scoring weeks" },
                        { label:"Cold Streak", val:tr.coldStreak > 0 ? `${tr.coldStreak} ${cadenceShort(league).toLowerCase()}${tr.coldStreak===1?"":"s"}` : "—", sub:"negative run", color:"#4d8aff", desc:"Longest consecutive run of negative-scoring weeks" },
                      ];
                      return (
                        <div style={{ marginBottom:14 }}>
                          <div style={{ fontSize:11,fontWeight:600,color:"#6a6a8a",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6 }}>Team Records</div>
                          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(150px, 1fr))",gap:6 }}>
                            {cells.map(c => (
                              <div key={c.label} onClick={c.cid ? ()=>openContestant(c.cid) : undefined}
                                style={{ padding:"8px 10px",background:"#0d0d18",borderRadius:8,border:"1px solid #1e1e38",cursor:c.cid?"pointer":"default" }}>
                                <div style={{ fontSize:9,fontWeight:700,color:"#6a6a8a",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:3 }}>{c.label}</div>
                                <div style={{ fontSize:14,fontWeight:800,fontFamily:"'Anybody',sans-serif",color:c.color,lineHeight:1 }}>{c.val}</div>
                                <div style={{ fontSize:10,color:"#8888aa",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.sub}</div>
                                {c.desc && <div style={{ fontSize:9,color:"#4a4a6a",marginTop:4,fontStyle:"italic",lineHeight:1.3 }}>{c.desc}</div>}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    {roster.length === 0 ? <div style={{ color:"#4a4a6a",fontSize:12,fontStyle:"italic",padding:"8px 0" }}>Empty roster</div> :
                      roster.map((c,idx)=>{
                        const basePts = getContestantWeekPts(c.id, viewWeek);
                        const multipliedPts = Math.round(basePts * c.multiplier * 100) / 100;
                        const tribeColor = getTribeColor(league, c);
                        const isMerged = league.merged || false;
                        const seasonPts = Math.round(weeks.reduce((s,w) => s + calcContestantWeekPoints(league.weeklyScores?.[w]||{}, c.id), 0)*10)/10;
                        const lastWkPts = weeks.length > 0 ? Math.round(calcContestantWeekPoints(league.weeklyScores?.[weeks[weeks.length-1]]||{}, c.id)*10)/10 : 0;
                        let bestWk = null, bestPts = -Infinity;
                        weeks.forEach(w => { const p = calcContestantWeekPoints(league.weeklyScores?.[w]||{}, c.id); if(p>bestPts){bestPts=p;bestWk=w;} });
                        bestPts = Math.round((bestPts===-Infinity?0:bestPts)*10)/10;
                        return (
                          <div key={c.id+(c.role||idx)} style={{ padding:"10px 0",borderBottom:"1px solid #1a1a30" }}>
                            <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                              <div style={{ flex:1 }}>
                                <div style={{ display:"flex",alignItems:"center",gap:6,flexWrap:"wrap" }}>
                                  <span onClick={()=>openContestant(c.id)} title="View contestant profile" style={{ color:"#e8e8f0",fontSize:14,fontWeight:600,cursor:"pointer",textDecoration:"underline",textDecorationColor:"#2a2a4a",textUnderlineOffset:3 }}>{c.name}</span>
                                  <MultiplierBadge role={c.role}/>
                                  {c.status==="eliminated" && <span style={{ color:"#e94560",fontSize:9 }}>ELIM</span>}
                                  {!isMerged && c.tribe && <span style={{ fontSize:9,fontWeight:600,padding:"1px 5px",borderRadius:3,background:tribeColor+"22",color:tribeColor }}>{c.tribe}</span>}
                                </div>
                              </div>
                              <div style={{ textAlign:"right" }}>
                                {basePts !== 0 && c.multiplier > 1 && (
                                  <div style={{ fontSize:9,color:"#6a6a8a" }}>{formatPts(basePts, league)} × {c.multiplier}</div>
                                )}
                                <div style={{ fontSize:16,fontWeight:800,fontFamily:"'Anybody',sans-serif",
                                  color:multipliedPts>0?"#4ecdc4":multipliedPts<0?"#e94560":"#6a6a8a"
                                }}>
                                  {multipliedPts !== 0 ? (multipliedPts>0?"+":"") + formatPts(multipliedPts, league) : "—"}
                                </div>
                              </div>
                            </div>
                            <div style={{ display:"flex",gap:14,fontSize:10,color:"#6a6a8a",marginTop:5,flexWrap:"wrap" }}>
                              <span>Last: <span style={{ color:lastWkPts>0?"#4ecdc4":lastWkPts<0?"#e94560":"#6a6a8a",fontWeight:600 }}>{lastWkPts>0?"+":""}{formatPts(lastWkPts, league)}</span></span>
                              <span>Best: <span style={{ color:"#f5a623",fontWeight:600 }}>{bestPts>0?"+":""}{formatPts(bestPts, league)}</span>{bestWk?` (${cadenceShort(league)} ${bestWk})`:""}</span>
                              <span>Season: <span style={{ fontWeight:600,color:"#ccc" }}>{formatPts(seasonPts, league)}</span></span>
                            </div>
                          </div>
                        );
                      })
                    }
                    {/* Team Game Log — per-week breakdown with contestant contribution chips */}
                    {weeks.length > 0 && (
                      <div style={{ marginTop:14 }}>
                        <div style={{ fontSize:11,fontWeight:600,color:"#6a6a8a",textTransform:"uppercase",marginBottom:6,letterSpacing:"0.05em" }}>Team Game Log</div>
                        <div style={{ borderRadius:8,border:"1px solid #1e1e38",overflow:"hidden" }}>
                          <div style={{ display:"flex",padding:"6px 10px",background:"#0d0d18",borderBottom:"1px solid #1e1e38" }}>
                            <div style={{ width:50,fontSize:10,fontWeight:600,color:"#6a6a8a" }}>{cadenceWord(league)}</div>
                            <div style={{ flex:1,fontSize:10,fontWeight:600,color:"#6a6a8a" }}>Contributions</div>
                            <div style={{ width:50,textAlign:"right",fontSize:10,fontWeight:600,color:"#6a6a8a" }}>Pts</div>
                          </div>
                          {weeks.map(w => {
                            const wPts = team.weeklyTotals?.[w] || 0;
                            const wkRoster = getTeamRosterForWeek(team, w);
                            const contribs = wkRoster.map(c => {
                              const base = calcContestantWeekPoints(league.weeklyScores?.[w]||{}, c.id);
                              const mp = Math.round(base * (c.multiplier||1) * 100) / 100;
                              return { id:c.id, name:c.name, pts:mp };
                            }).filter(c => c.pts !== 0);
                            if (wPts === 0 && contribs.length === 0) return null;
                            return (
                              <div key={w} style={{ display:"flex",alignItems:"flex-start",padding:"8px 10px",borderBottom:"1px solid #1a1a30" }}>
                                <div style={{ width:50,fontSize:12,fontWeight:600,color:"#8888aa" }}>{cadenceShort(league)} {w}</div>
                                <div style={{ flex:1,display:"flex",flexWrap:"wrap",gap:3 }}>
                                  {contribs.length === 0 ? (
                                    <span style={{ fontSize:9,color:"#4a4a6a",fontStyle:"italic" }}>(no scored contributions)</span>
                                  ) : contribs.map((c,i) => (
                                    <span key={i} onClick={()=>openContestant(c.id)} title="View contestant profile" style={{ fontSize:9,padding:"2px 5px",borderRadius:3,background:c.pts>=0?"#4ecdc418":"#e9456018",color:c.pts>=0?"#4ecdc4":"#e94560",whiteSpace:"nowrap",cursor:"pointer" }}>
                                      {c.name} {c.pts>0?"+":""}{formatPts(c.pts, league)}
                                    </span>
                                  ))}
                                </div>
                                <div style={{ width:50,textAlign:"right",fontWeight:700,fontSize:13,fontFamily:"'Anybody',sans-serif",color:wPts>0?"#4ecdc4":wPts<0?"#e94560":"#6a6a8a" }}>
                                  {wPts>0?"+":""}{formatPts(wPts, league)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* League-wide polls — moved here from My Roster in v2.4.42.0 so they're
          visible to all managers (Standings is the universal landing tab).
          v2.4.44.0: header + Add button moved into PollsSection so the create
          form can collapse cleanly under the title row.
          v2.4.48.0: the brief CastBreakdownSection (v2.4.45.0) was removed from
          here — the Cast tab already has a richer contestant leaderboard with
          filter/sort + game log per contestant. See ContestantsTab. */}
      <div style={{ marginTop:24,paddingTop:16,borderTop:"1px solid #1e1e38" }}>
        <PollsSection league={league} team={(league.teams||[]).find(t => t.id === myTeamId)} onUpdate={onUpdate} isCommissioner={isCommissioner} />
      </div>
      {teamModalTeam && (
        <TeamProfileModal team={teamModalTeam} league={league} standings={standings} onClose={()=>setTeamModalId(null)} />
      )}
      {lightboxContestant && (
        <ContestantPhotoLightbox contestant={lightboxContestant} league={league} onClose={()=>setLightboxContestantId(null)} />
      )}
    </div>
  );
}

// Full-page modal showing a team's identity: large avatar, name, manager, current
// standing, and a plain-text roster. Designed to fit on screen without scrolling
// (avatar sized with vh units, compact text-only roster rows). Scoring detail is
// intentionally NOT here — that's the inline standings expand's job.
function TeamProfileModal({ team, league, standings, onClose }) {
  const contestants = league.contestants || [];
  let roster = [];
  if (league.format === "captains") {
    const dc = team.depthChart || {};
    if (dc.captain)   { const c = contestants.find(x=>x.id===dc.captain);   if(c) roster.push({ ...c, role:"captain",   multiplier:2 }); }
    if (dc.coCaptain) { const c = contestants.find(x=>x.id===dc.coCaptain); if(c) roster.push({ ...c, role:"coCaptain", multiplier:1.5 }); }
    (dc.regulars||[]).forEach(rid => { const c = contestants.find(x=>x.id===rid); if(c) roster.push({ ...c, role:"regular", multiplier:1 }); });
  } else {
    const wk = String(league.currentWeek || 1);
    const ids = team.weeklyRosters?.[wk] || [];
    roster = ids.map(id => contestants.find(c=>c.id===id)).filter(Boolean).map(c=>({...c,role:"regular",multiplier:1}));
  }

  // Look up the team's rank from the passed standings (already computed by the parent).
  const rankIdx = (standings || []).findIndex(s => s.id === team.id);
  const standingTeam = rankIdx >= 0 ? standings[rankIdx] : null;
  const rank = rankIdx >= 0 ? rankIdx + 1 : null;
  const rankMedal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  const rankColor = rank === 1 ? "#ff4d6a" : rank === 2 ? "#c0c0d0" : rank === 3 ? "#cd7f32" : "#8888aa";

  function roleLabel(r) {
    if (r === "captain")   return "Hero";
    if (r === "coCaptain") return "Side-Kick";
    if (r === "regular")   return league.format === "captains" ? "Vigilante" : "Pick";
    return "";
  }

  return (
    <div style={{ position:"fixed",inset:0,zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",
      background:"rgba(0,0,0,0.85)",backdropFilter:"blur(6px)",animation:"fadeIn 0.15s ease",padding:16 }} onClick={onClose}>
      <div style={{ background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:18,
        width:440,maxWidth:"96vw",maxHeight:"96vh",overflow:"hidden",
        display:"flex",flexDirection:"column",
        boxShadow:"0 32px 100px rgba(0,0,0,0.6)",animation:"slideUp 0.2s ease" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex",justifyContent:"flex-end",padding:"10px 10px 0",flexShrink:0 }}>
          <button onClick={onClose} style={{ background:"#1a1a2e",border:"1px solid #2a2a4a",borderRadius:8,color:"#888",cursor:"pointer",padding:6,display:"flex",alignItems:"center",justifyContent:"center" }}><Icon name="x" size={18}/></button>
        </div>
        <div style={{ padding:"0 24px 22px",display:"flex",flexDirection:"column",alignItems:"center",gap:10,minHeight:0,flex:1 }}>
          {team.teamAvatar ? (
            <img src={team.teamAvatar} alt={team.name} style={{ width:"min(360px, 42vh)",height:"min(360px, 42vh)",borderRadius:20,objectFit:"cover",border:"4px solid "+(team.teamColor||"#e94560"),flexShrink:0 }} />
          ) : (
            <div style={{ width:"min(360px, 42vh)",height:"min(360px, 42vh)",borderRadius:20,display:"flex",alignItems:"center",justifyContent:"center",
              background:team.teamColor||"#1a1a2e",fontFamily:"'Anybody',sans-serif",fontSize:130,fontWeight:900,color:"#fff",border:"4px solid "+(team.teamColor||"#e94560"),flexShrink:0 }}>
              {team.name?.[0]}
            </div>
          )}
          <div style={{ textAlign:"center",flexShrink:0 }}>
            <div style={{ fontSize:22,fontWeight:900,fontFamily:"'Anybody',sans-serif",color:"#e8e8f0",letterSpacing:"-0.01em",lineHeight:1.1 }}>{team.name}</div>
            <div style={{ marginTop:4,fontSize:12,color:"#8888aa",display:"flex",alignItems:"center",justifyContent:"center",gap:6,flexWrap:"wrap" }}>
              <span>Manager: <span style={{ color:"#ccc",fontWeight:600 }}>{team.owner || "—"}</span></span>
              {rank && <>
                <span style={{ color:"#3a3a5a" }}>·</span>
                <span style={{ display:"inline-flex",alignItems:"center",gap:3,color:rankColor,fontWeight:700 }}>
                  {rankMedal && <span style={{ fontSize:13 }}>{rankMedal}</span>}
                  #{rank} of {standings.length}
                </span>
                {standingTeam && (standingTeam.h2hRecord ? (
                  <><span style={{ color:"#3a3a5a" }}>·</span><span>{standingTeam.h2hRecord}</span></>
                ) : (
                  <><span style={{ color:"#3a3a5a" }}>·</span><span>{formatPts(standingTeam.total, league)} pts</span></>
                ))}
              </>}
            </div>
          </div>
          <div style={{ width:"100%",flexShrink:0,marginTop:4 }}>
            <div style={{ fontSize:10,fontWeight:700,color:"#6a6a8a",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6,textAlign:"center" }}>
              {league.format === "captains" ? "Depth Chart" : `Current ${cadenceWord(league)} Roster`}
            </div>
            {roster.length === 0 ? (
              <div style={{ padding:"10px",textAlign:"center",color:"#6a6a8a",fontSize:12,background:"#12121f",borderRadius:8,border:"1px dashed #2a2a4a" }}>
                Empty roster
              </div>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",background:"#12121f",borderRadius:8,border:"1px solid #1e1e38",overflow:"hidden" }}>
                {roster.map((c,idx) => (
                  <div key={c.id+"_"+idx} style={{ display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderBottom:idx<roster.length-1?"1px solid #1a1a30":"none" }}>
                    <span style={{ fontSize:10,fontWeight:700,color:c.role==="captain"?"#f5a623":c.role==="coCaptain"?"#4ecdc4":"#6a6a8a",width:62,flexShrink:0,textTransform:"uppercase",letterSpacing:"0.04em" }}>
                      {roleLabel(c.role)}
                    </span>
                    <span style={{ flex:1,minWidth:0,color:"#e8e8f0",fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.name}</span>
                    {c.status==="eliminated" && <span style={{ color:"#e94560",fontSize:9,fontWeight:600 }}>ELIM</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Editor for league.couples. A contestant can appear in at most one couple at a
// time — when a new couple is added, any prior couple containing either member is
// dissolved automatically (matches Love Island recoupling semantics).
function CouplesEditor({ league, onUpdate }) {
  const [m1, setM1] = useState("");
  const [m2, setM2] = useState("");
  const contestants = league.contestants || [];
  const couples = league.couples || [];
  const byId = Object.fromEntries(contestants.map(c => [c.id, c]));

  function addCouple() {
    if (!m1 || !m2 || m1 === m2) return;
    // Dissolve any existing couples that contain either member
    const filtered = couples.filter(c => {
      const mem = c.members || [];
      return !mem.includes(m1) && !mem.includes(m2);
    });
    const newCouple = { id: generateId(), members: [m1, m2] };
    onUpdate({ ...league, couples: [...filtered, newCouple] });
    setM1(""); setM2("");
  }

  function dissolveCouple(coupleId) {
    onUpdate({ ...league, couples: couples.filter(c => c.id !== coupleId) });
  }

  const inACoupleIds = new Set(couples.flatMap(c => c.members || []));
  const pickable = contestants.filter(c => c.status !== "eliminated");

  return (
    <div>
      <div style={{ fontSize:11,color:"#6a6a8a",marginBottom:10,lineHeight:1.4 }}>
        Couples are informational during the regular season (a heart badge appears next to each contestant on the Cast tab). In the final week, managers will pick a Hero couple and a Sidekick couple instead of a depth chart. A contestant can be in only one couple — adding a new couple auto-dissolves any prior one for either member.
      </div>

      {couples.length === 0 && (
        <div style={{ padding:"14px",textAlign:"center",color:"#6a6a8a",fontSize:12,background:"#12121f",borderRadius:8,border:"1px solid #1e1e38",marginBottom:12 }}>
          No couples yet. Add one below.
        </div>
      )}

      {couples.map(c => {
        const [aId, bId] = c.members || [];
        const a = byId[aId]; const b = byId[bId];
        if (!a || !b) return null;
        return (
          <div key={c.id} style={{ display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#12121f",borderRadius:8,border:"1px solid #1e1e38",marginBottom:6 }}>
            <ContestantAvatar contestant={a} league={league} size={28} />
            <div style={{ fontSize:12,fontWeight:600,color:"#e8e8f0",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{a.name}</div>
            <span style={{ color:"#e94560",fontSize:14 }}>♥</span>
            <ContestantAvatar contestant={b} league={league} size={28} />
            <div style={{ fontSize:12,fontWeight:600,color:"#e8e8f0",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{b.name}</div>
            <button onClick={()=>dissolveCouple(c.id)} title="Dissolve couple" style={{
              background:"none",border:"1px solid #2a2a4a",borderRadius:6,color:"#e94560",
              width:26,height:26,cursor:"pointer",fontSize:14,flexShrink:0,
            }}>×</button>
          </div>
        );
      })}

      <div style={{ marginTop:12,padding:"10px 12px",background:"#12121f",borderRadius:8,border:"1px solid #1e1e38" }}>
        <div style={{ fontSize:11,fontWeight:600,color:"#8888aa",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em" }}>Add Couple</div>
        <div style={{ display:"flex",gap:6,alignItems:"center" }}>
          <select value={m1} onChange={e=>setM1(e.target.value)} style={{
            flex:1,padding:"6px 10px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
            color:m1?"#e8e8f0":"#6a6a8a",fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none",minWidth:0,
          }}>
            <option value="">— Pick contestant —</option>
            {pickable.map(c => (
              <option key={c.id} value={c.id}>{c.name}{inACoupleIds.has(c.id)?" (currently coupled)":""}</option>
            ))}
          </select>
          <span style={{ color:"#e94560",fontSize:14 }}>♥</span>
          <select value={m2} onChange={e=>setM2(e.target.value)} style={{
            flex:1,padding:"6px 10px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
            color:m2?"#e8e8f0":"#6a6a8a",fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none",minWidth:0,
          }}>
            <option value="">— Pick contestant —</option>
            {pickable.filter(c => c.id !== m1).map(c => (
              <option key={c.id} value={c.id}>{c.name}{inACoupleIds.has(c.id)?" (currently coupled)":""}</option>
            ))}
          </select>
          <Btn small onClick={addCouple} disabled={!m1 || !m2 || m1 === m2}>Add</Btn>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONTESTANTS TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ContestantsTab({ league, onUpdate, setModal, setEditing, readOnly }) {
  const [managePhotos, setManagePhotos] = useState(false);
  const [manageMode, setManageMode] = useState("photos");
  // v2.4.51.0: default filter to "active" — non-active contestants are
  // historical noise for the typical "who's scoring well right now?" question.
  const [filter, setFilter] = useState("active");
  const [expandedId, setExpandedId] = useState(null);
  // v2.4.51.0: replaced the 5 sort pills (Season/LastWk/Best/Worst/A-Z) with a
  // single dropdown so a per-week option fits — same set + every scored week.
  // Values: "total" | "best" | "worst" | "lastWeek" | "week:<N>" | "name"
  const [sortBy, setSortBy] = useState("total");
  const [selectedForMove, setSelectedForMove] = useState(new Set());

  const weeks = Object.keys(league.weeklyScores || {}).sort((a,b)=>+a - +b);
  const tribes = league.tribes || {};
  const tribeNames = Object.keys(tribes);
  const isMerged = league.merged || false;
  // v2.5.2.0: group per-episode score entries into draft weeks for multi-episode
  // shows (Love Island ~6/wk, Big Brother 3/wk). For single-episode shows
  // (Survivor etc.), each draft week has one episode and the behavior is
  // identical to before. Used by the sort dropdown (draft-week labels) and the
  // per-week card rendering (episode chips when multi-ep).
  const epsPerWk = league.episodesPerWeek || 1;
  const draftWeeksGrouped = useMemo(() => {
    if (epsPerWk === 1) return weeks.map(w => ({ num: w, episodes: [w] }));
    const groups = {};
    weeks.forEach(w => {
      const dw = String(Math.ceil(Number(w) / epsPerWk));
      if (!groups[dw]) groups[dw] = [];
      groups[dw].push(w);
    });
    return Object.entries(groups)
      .map(([num, eps]) => ({ num, episodes: eps.sort((a,b) => +a - +b) }))
      .sort((a,b) => +a.num - +b.num);
  }, [weeks, epsPerWk]);
  // For multi-ep, opens the per-episode game-log modal when a chip is tapped.
  const [episodeModal, setEpisodeModal] = useState(null); // { contestantId, episode } | null

  const contestantStats = useMemo(() => {
    return (league.contestants||[]).map(c => {
      const weeklyTotals = {};
      let total = 0;
      weeks.forEach(w => {
        const pts = calcContestantWeekPoints(league.weeklyScores?.[w] || {}, c.id);
        weeklyTotals[w] = Math.round(pts * 100) / 100;
        total += pts;
      });
      const prevWeek = String((league.currentWeek||1) - 1);
      const lastWeekPts = prevWeek !== "0" ? (weeklyTotals[prevWeek] || 0) : 0;
      let bestWeekPts = -Infinity, worstWeekPts = Infinity, bestWeekNum = null, worstWeekNum = null;
      weeks.forEach(w => { const p = weeklyTotals[w]||0; if(p>bestWeekPts){bestWeekPts=p;bestWeekNum=w;} if(p<worstWeekPts){worstWeekPts=p;worstWeekNum=w;} });
      if (bestWeekPts === -Infinity) bestWeekPts = 0;
      if (worstWeekPts === Infinity) worstWeekPts = 0;
      return { ...c, total: Math.round(total * 100) / 100, weeklyTotals, lastWeekPts: Math.round(lastWeekPts*100)/100, bestWeekPts: Math.round(bestWeekPts*100)/100, worstWeekPts: Math.round(worstWeekPts*100)/100, bestWeekNum, worstWeekNum };
    });
  }, [league, weeks]);

  const filtered = contestantStats.filter(c => {
    if (filter==="active") return c.status!=="eliminated";
    if (filter==="eliminated") return c.status==="eliminated";
    return true;
  }).sort((a,b) => {
    if (sortBy === "total") return b.total - a.total;
    if (sortBy === "lastWeek") return b.lastWeekPts - a.lastWeekPts;
    if (sortBy === "best") return b.bestWeekPts - a.bestWeekPts;
    if (sortBy === "worst") return a.worstWeekPts - b.worstWeekPts;
    if (sortBy.startsWith("week:")) {
      const dw = sortBy.slice(5);
      const eps = draftWeeksGrouped.find(g => g.num === dw)?.episodes || [];
      const sumA = eps.reduce((s, e) => s + (a.weeklyTotals?.[e] || 0), 0);
      const sumB = eps.reduce((s, e) => s + (b.weeklyTotals?.[e] || 0), 0);
      return sumB - sumA;
    }
    return a.name.localeCompare(b.name);
  });

  function getWeekDetail(cid, weekNum) {
    const ws = league.weeklyScores?.[weekNum] || {};
    const cs = ws[cid] || {};
    return (league.scoringRules||[]).filter(r => cs[r.id] && cs[r.id] !== 0).map(r => {
      const pts = cs[r.id];
      const count = r.points !== 0 ? Math.round(pts / r.points) : 0;
      return { rule: r, count, pts: Math.round(pts * 100) / 100 };
    });
  }

  // ─── Tribe mgmt ───
  function toggleSelect(cid) {
    setSelectedForMove(prev => { const n = new Set(prev); if (n.has(cid)) n.delete(cid); else n.add(cid); return n; });
  }
  function selectTribe(tn) {
    const ids = (tribes[tn]||[]).filter(id => (league.contestants||[]).some(c=>c.id===id&&c.status!=="eliminated"));
    setSelectedForMove(prev => { const n = new Set(prev); const all = ids.every(id=>n.has(id)); ids.forEach(id=>{if(all)n.delete(id);else n.add(id)}); return n; });
  }
  function moveSelectedToTribe(target) {
    if (selectedForMove.size===0) return;
    const nt = {}; Object.entries(tribes).forEach(([n,m])=>{nt[n]=m.filter(id=>!selectedForMove.has(id))});
    if (!nt[target]) nt[target]=[];
    selectedForMove.forEach(id=>{if(!nt[target].includes(id))nt[target].push(id)});
    const uc = (league.contestants||[]).map(c=>selectedForMove.has(c.id)?{...c,tribe:target}:c);
    onUpdate({...league,tribes:nt,contestants:uc});
    setSelectedForMove(new Set());
  }
  function addNewTribe() {
    const name = prompt("New tribe name:"); if (!name?.trim()) return;
    const color = prompt("Tribe color (hex, e.g. #ff6600):", "#888888") || "#888888";
    onUpdate({...league,tribes:{...tribes,[name.trim()]:[]},tribeColors:{...(league.tribeColors||{}),[name.trim()]:color.trim()}});
  }
  function removeTribe(tn) {
    if (!confirm("Remove tribe \""+tn+"\"? Members become unassigned.")) return;
    const nt={...tribes}; const rm=nt[tn]||[]; delete nt[tn];
    const uc=(league.contestants||[]).map(c=>rm.includes(c.id)?{...c,tribe:null}:c);
    onUpdate({...league,tribes:nt,contestants:uc});
  }
  function toggleMerge() {
    if (!isMerged) { const mn=prompt("Merged tribe name:","Merged"); if(!mn?.trim())return; onUpdate({...league,merged:true,mergedTribeName:mn.trim()}); }
    else { onUpdate({...league,merged:false,mergedTribeName:null}); }
  }
  function reassignSingle(cid,newT) {
    const nt={}; Object.entries(tribes).forEach(([n,m])=>{nt[n]=m.filter(id=>id!==cid)});
    if(newT&&nt[newT])nt[newT].push(cid);
    const uc=(league.contestants||[]).map(c=>c.id===cid?{...c,tribe:newT||null}:c);
    onUpdate({...league,tribes:nt,contestants:uc});
  }


  // ─── NORMAL VIEW ───
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <h3 style={{margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em"}}>Cast Standings</h3>
        <div style={{display:"flex",gap:6}}>
          {!readOnly&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <Btn small onClick={()=>{setEditing(null);setModal("add-contestant")}}><Icon name="plus" size={14}/> Add</Btn>
            {/* v2.6.6.0: import the admin-managed cast for this league's
                (showType, seasonNumber). Skips contestants already present
                (matched by case-insensitive name) so re-imports are idempotent. */}
            {league.seasonNumber && <Btn small variant="ghost" onClick={async ()=>{
              const data = await loadData(`showCast/${league.showType}/season_${league.seasonNumber}`, null);
              const incoming = Array.isArray(data?.contestants) ? data.contestants : [];
              if (incoming.length === 0) {
                alert(`No show cast set up yet for ${SHOW_PRESETS[league.showType]?.name || league.showType} Season ${league.seasonNumber}. Ask the admin to populate it.`);
                return;
              }
              const existing = new Set((league.contestants||[]).map(c => (c.name||"").toLowerCase().trim()));
              const toAdd = incoming.filter(sc => !existing.has((sc.name||"").toLowerCase().trim())).map(sc => ({
                id: generateId(),
                name: sc.name,
                photoUrl: sc.photoUrl || "",
                gender: sc.gender || "",
                tribe: sc.tribe || null,
                status: "active",
                bio: "",
              }));
              if (toAdd.length === 0) { alert(`All ${incoming.length} contestants from the show cast are already in this league.`); return; }
              if (!confirm(`Import ${toAdd.length} contestant${toAdd.length===1?"":"s"} from ${SHOW_PRESETS[league.showType]?.name || league.showType} Season ${league.seasonNumber}?`)) return;
              onUpdate({ ...league, contestants: [...(league.contestants||[]), ...toAdd] });
            }}>📥 Import Cast</Btn>}
            <Btn small variant="ghost" onClick={()=>setManagePhotos(!managePhotos)}>Manage</Btn>
          </div>}
        </div>
      </div>
      {/* v2.4.51.0: removed the merge banner that ran across the top \u2014 once a
          season is merged, the banner was a permanent header taking space. The
          merge state still shows naturally per-contestant (tribe field reflects
          the merged tribe name). Commissioners can still toggle merge from the
          Manage \u203a Tribes panel below. */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
        {/* v2.4.52.0: order Active first (default), then All. Eliminated removed \u2014
            it was rarely used and added clutter; users can still see eliminated
            contestants by switching to All. */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["active","all"].map(f=>(<button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 14px",borderRadius:99,border:filter===f?"1px solid #e9456044":"1px solid #1e1e38",cursor:"pointer",fontSize:12,fontWeight:600,textTransform:"capitalize",background:filter===f?"#e9456018":"transparent",color:filter===f?"#e94560":"#7a7a9a",fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>{f}{f==="all"?` (${league.contestants?.length||0})`:""}</button>))}
        </div>
        {/* v2.4.51.0: 5-pill sort \u2192 1 dropdown so per-week options can live in
            the same control. v2.4.52.0: capped maxWidth + <optgroup>.
            v2.5.0.0: dropped the "Other" group (only A\u2013Z lived there); A\u2013Z
            is now a plain option at the top of Overall. The literal "A\u2013Z" was
            rendering as "A\u2013Z" in some build configs because of how JSX
            text nodes handle the en-dash byte \u2014 wrapping in a JSX expression
            container with a quoted string forces JS escape interpretation. */}
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{
          padding:"6px 10px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
          color:"#e8e8f0",fontSize:12,fontFamily:"'Outfit',sans-serif",cursor:"pointer",outline:"none",
          maxWidth:200,
        }}>
          <optgroup label="Overall">
            <option value="total">Season Total</option>
            <option value="best">Best {cadenceWord(league)}</option>
            <option value="worst">Worst {cadenceWord(league)}</option>
            <option value="lastWeek">Last {cadenceWord(league)}</option>
            <option value="name">{"A\u2013Z"}</option>
          </optgroup>
          {draftWeeksGrouped.length > 0 && (
            <optgroup label="Week">
              {draftWeeksGrouped.map(dw => <option key={dw.num} value={`week:${dw.num}`}>Week {dw.num}</option>)}
            </optgroup>
          )}
        </select>
      </div>
      {/* Manage Contestants panel */}
      {managePhotos && !readOnly && (
        <div style={{ marginBottom:16,padding:"14px 16px",background:"#0d0d18",borderRadius:12,border:"1px solid #1e1e38" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
            <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0" }}>Manage Contestants</div>
            <button onClick={()=>setManagePhotos(false)} style={{ background:"none",border:"none",color:"#6a6a8a",cursor:"pointer" }}>Done</button>
          </div>
          <div style={{ display:"flex",gap:6,marginBottom:12 }}>
            {[
              {id:"photos",label:"Photos"},
              {id:"gender",label:"Gender"},
              {id:"couples",label:"Couples"},
              ...(league.showType === "survivor" ? [{id:"tribes",label:"Tribes"}] : []),
            ].map(m => (
              <button key={m.id} onClick={()=>setManageMode(m.id)} style={{
                padding:"6px 14px",borderRadius:99,border:manageMode===m.id?"1px solid #e9456044":"1px solid #1e1e38",
                background:manageMode===m.id?"#e9456018":"transparent",color:manageMode===m.id?"#e94560":"#7a7a9a",
                fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .15s",
              }}>{m.label}</button>
            ))}
          </div>
          {manageMode === "photos" && (
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              {(league.contestants||[]).map(c => {
                const isDataUri = (c.photoUrl||"").startsWith("data:");
                async function uploadPhoto(file) {
                  if (!file || !file.type?.startsWith("image/")) return;
                  try {
                    const dataUri = await resizeImageToDataURI(file, 512, 0.8);
                    onUpdate({...league, contestants: league.contestants.map(x=>x.id===c.id?{...x,photoUrl:dataUri,photoCropY:x.photoCropY||20,photoCropZoom:x.photoCropZoom||1}:x)});
                  } catch { /* swallow */ }
                }
                return (
                  <div key={c.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"#12121f",borderRadius:8,border:"1px solid #1e1e38" }}>
                    <ContestantAvatar contestant={c} league={league} size={32} />
                    <div style={{ width:100,fontSize:12,fontWeight:600,color:c.status==="eliminated"?"#6a6a8a":"#e8e8f0",flexShrink:0 }}>{c.name}</div>
                    <input
                      placeholder={isDataUri ? "Uploaded image · paste URL to replace" : "Photo URL"}
                      defaultValue={isDataUri ? "" : (c.photoUrl||"")}
                      key={c.photoUrl}
                      onBlur={e=>{
                        const url = e.target.value.trim();
                        if (url && url !== (c.photoUrl||"")) {
                          onUpdate({...league, contestants: league.contestants.map(x=>x.id===c.id?{...x,photoUrl:url}:x)});
                        }
                      }}
                      onPaste={e=>{
                        const items = e.clipboardData?.items || [];
                        for (const it of items) {
                          if (it.type?.startsWith("image/")) {
                            e.preventDefault();
                            const blob = it.getAsFile();
                            if (blob) uploadPhoto(blob);
                            return;
                          }
                        }
                      }}
                      style={{ flex:1,padding:"6px 10px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
                        color:"#e8e8f0",fontSize:12,fontFamily:"'Outfit',sans-serif",minWidth:0 }}
                    />
                    <label title="Upload image" style={{ cursor:"pointer",padding:"5px 9px",background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:6,color:"#4ecdc4",fontSize:11,fontWeight:600,flexShrink:0 }}>
                      Upload
                      <input type="file" accept="image/*" onChange={e=>{ uploadPhoto(e.target.files?.[0]); e.target.value=""; }} style={{ display:"none" }} />
                    </label>
                    {c.photoUrl && <>
                      <input type="range" min="0" max="100" defaultValue={c.photoCropY||20} key={"y"+c.photoUrl}
                        onChange={e=>{
                          onUpdate({...league, contestants: league.contestants.map(x=>x.id===c.id?{...x,photoCropY:Number(e.target.value)}:x)});
                        }}
                        style={{ width:50,accentColor:"#e94560",flexShrink:0 }} title="Position" />
                      <input type="range" min="1" max="3" step="0.1" defaultValue={c.photoCropZoom||1} key={"z"+c.photoUrl}
                        onChange={e=>{
                          onUpdate({...league, contestants: league.contestants.map(x=>x.id===c.id?{...x,photoCropZoom:Number(e.target.value)}:x)});
                        }}
                        style={{ width:40,accentColor:"#4ecdc4",flexShrink:0 }} title="Zoom" />
                      <div style={{ width:28,height:28,borderRadius:6,overflow:"hidden",flexShrink:0 }}>
                        <img src={c.photoUrl} style={{ width:"100%",height:"100%",objectFit:"cover",objectPosition:`center ${c.photoCropY||20}%`,transform:`scale(${c.photoCropZoom||1})`,transformOrigin:`center ${c.photoCropY||20}%` }} onError={e=>{e.target.style.display="none"}} />
                      </div>
                    </>}
                  </div>
                );
              })}
            </div>
          )}
          {manageMode === "gender" && (
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              {(league.contestants||[]).map(c => (
                <div key={c.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 10px",background:"#12121f",borderRadius:8,border:"1px solid #1e1e38" }}>
                  <ContestantAvatar contestant={c} league={league} size={32} />
                  <div style={{ flex:1,fontSize:12,fontWeight:600,color:c.status==="eliminated"?"#6a6a8a":"#e8e8f0",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{c.name}</div>
                  <select value={c.gender||""} onChange={e=>{
                    const g = e.target.value;
                    onUpdate({...league, contestants: league.contestants.map(x=>x.id===c.id?{...x,gender:g}:x)});
                  }} style={{
                    width:140,padding:"6px 10px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
                    color:c.gender?"#e8e8f0":"#6a6a8a",fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none",
                  }}>
                    <option value="">— Not set —</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              ))}
            </div>
          )}
          {manageMode === "couples" && (
            <CouplesEditor league={league} onUpdate={onUpdate} />
          )}
          {manageMode === "tribes" && league.showType === "survivor" && (() => {
            const ac = (league.contestants||[]).filter(c=>c.status!=="eliminated");
            const unassigned = ac.filter(c=>!tribeNames.some(t=>(tribes[t]||[]).includes(c.id)));
            return (
              <div>
                <div style={{padding:"12px 14px",borderRadius:10,marginBottom:14,background:isMerged?"#f5a62311":"#0d0d18",border:isMerged?"1px solid #f5a62333":"1px solid #1e1e38",display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <div>
                    <div style={{color:"#e8e8f0",fontWeight:700,fontSize:13}}>{isMerged?`🏴 Merged: ${league.mergedTribeName||"Merged"}`:"Tribes Active"}</div>
                    <div style={{color:"#6a6a8a",fontSize:11,marginTop:2}}>{isMerged?"All contestants one group. Original tribes kept for reference.":"Contestants grouped by tribe."}</div>
                  </div>
                  <Btn small variant={isMerged?"danger":"success"} onClick={toggleMerge}>{isMerged?"Unmerge":"Merge Tribes"}</Btn>
                </div>
                {selectedForMove.size>0&&(<div style={{padding:"10px 14px",borderRadius:8,marginBottom:14,background:"#e9456011",border:"1px solid #e9456033"}}>
                  <div style={{fontSize:12,fontWeight:600,color:"#e94560",marginBottom:8}}>{selectedForMove.size} selected — move to:</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{tribeNames.map(t=><Btn key={t} small variant="secondary" onClick={()=>moveSelectedToTribe(t)}>{t}</Btn>)}<Btn small variant="ghost" onClick={()=>setSelectedForMove(new Set())}>Cancel</Btn></div>
                </div>)}
                {tribeNames.map(tribe=>{
                  const mids=(tribes[tribe]||[]).filter(id=>ac.some(c=>c.id===id));
                  const tribeCol = (league.tribeColors||{})[tribe] || "#888";
                  const members=mids.map(id=>ac.find(c=>c.id===id)).filter(Boolean);
                  return (<div key={tribe} style={{marginBottom:14}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                        <input type="color" value={tribeCol} onChange={e=>onUpdate({...league,tribeColors:{...(league.tribeColors||{}),[tribe]:e.target.value}})}
                          style={{width:28,height:28,border:"none",borderRadius:4,cursor:"pointer",padding:0,background:"transparent"}} title="Change tribe color" />
                        <div style={{fontSize:13,fontWeight:700,color:tribeCol}}>{tribe}</div>
                        <span style={{fontSize:11,color:"#6a6a8a"}}>({members.length})</span>
                        <button onClick={()=>selectTribe(tribe)} style={{background:"none",border:"1px solid #2a2a4a",borderRadius:4,padding:"4px 10px",fontSize:11,color:"#8888aa",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Select All</button>
                      </div>
                      <button onClick={()=>removeTribe(tribe)} style={{background:"none",border:"none",color:"#4a4a6a",cursor:"pointer",padding:2}}><Icon name="trash" size={12}/></button>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:3}}>
                      {members.map(c=>{const sel=selectedForMove.has(c.id);return(
                        <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,background:sel?"#e9456018":"#12121f",border:sel?"1px solid #e9456033":"1px solid #1e1e38"}}>
                          <button onClick={()=>toggleSelect(c.id)} style={{width:24,height:24,borderRadius:4,border:sel?"none":"2px solid #3a3a5a",cursor:"pointer",background:sel?"#e94560":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{sel&&<Icon name="check" size={10}/>}</button>
                          <span style={{flex:1,color:"#e8e8f0",fontSize:12,fontWeight:500}}>{c.name}</span>
                          <select value={c.tribe||""} onChange={e=>reassignSingle(c.id,e.target.value)} style={{padding:"3px 8px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:4,color:"#8888aa",fontSize:11,fontFamily:"'Outfit',sans-serif"}}>
                            {tribeNames.map(t=><option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      )})}
                      {members.length===0&&<div style={{color:"#4a4a6a",fontSize:11,fontStyle:"italic",padding:"6px 12px"}}>No active members</div>}
                    </div>
                  </div>);
                })}
                {unassigned.length>0&&(<div style={{marginBottom:14}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#f5a623",marginBottom:6}}>Unassigned ({unassigned.length})</div>
                  <div style={{display:"flex",flexDirection:"column",gap:3}}>
                    {unassigned.map(c=>{const sel=selectedForMove.has(c.id);return(
                      <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,background:sel?"#e9456018":"#12121f",border:sel?"1px solid #e9456033":"1px solid #1e1e38"}}>
                        <button onClick={()=>toggleSelect(c.id)} style={{width:24,height:24,borderRadius:4,border:sel?"none":"2px solid #3a3a5a",cursor:"pointer",background:sel?"#e94560":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{sel&&<Icon name="check" size={10}/>}</button>
                        <span style={{flex:1,color:"#e8e8f0",fontSize:12}}>{c.name}</span>
                      </div>
                    )})}
                  </div>
                </div>)}
                <Btn small variant="ghost" onClick={addNewTribe}><Icon name="plus" size={12}/> Add New Tribe</Btn>
              </div>
            );
          })()}
        </div>
      )}

      {filtered.length===0?<EmptyState message="No contestants found."/>:(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {filtered.map((c,rank)=>{
            const isExp=expandedId===c.id;
            // Determine display values based on sort
            let bigVal, bigLabel, subtitle;
            if(sortBy==="total"){bigVal=c.total;bigLabel=null;subtitle=c.lastWeekPts!==0?`Last ${cadenceShort(league).toLowerCase()}: ${c.lastWeekPts>0?"+":""}${formatPts(c.lastWeekPts, league)}`:null;}
            else if(sortBy==="lastWeek"){bigVal=c.lastWeekPts;bigLabel=`${cadenceShort(league).toLowerCase()} ${(league.currentWeek||1)-1}`;subtitle=`Season: ${formatPts(c.total, league)}`;}
            else if(sortBy==="best"){bigVal=c.bestWeekPts;bigLabel=c.bestWeekNum?`${cadenceShort(league).toLowerCase()} ${c.bestWeekNum}`:null;subtitle=`Season: ${formatPts(c.total, league)}`;}
            else if(sortBy==="worst"){bigVal=c.worstWeekPts;bigLabel=c.worstWeekNum?`${cadenceShort(league).toLowerCase()} ${c.worstWeekNum}`:null;subtitle=`Season: ${formatPts(c.total, league)}`;}
            else if(sortBy.startsWith("week:")){const dw=sortBy.slice(5);const eps=draftWeeksGrouped.find(g=>g.num===dw)?.episodes||[];bigVal=eps.reduce((s,e)=>s+(c.weeklyTotals?.[e]||0),0);bigLabel=`week ${dw}`;subtitle=epsPerWk>1?`${eps.length} episodes`:`Season: ${formatPts(c.total, league)}`;}
            else{bigVal=c.total;bigLabel=null;subtitle=null;}
            return(<div key={c.id} style={{borderRadius:12,background:"#12121f",border:"1px solid #1e1e38",opacity:c.status==="eliminated"?0.5:1,overflow:"hidden",transition:"all 0.2s"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer"}} onClick={()=>setExpandedId(isExp?null:c.id)}>
                <div style={{width:28,textAlign:"center",fontSize:13,fontWeight:700,color:"#6a6a8a"}}>{sortBy!=="name"?(rank+1):""}</div>
                <ContestantAvatar contestant={c} league={league} size={36} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:"#e8e8f0",fontWeight:600,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                    {c.name}
                    {(() => { const pid = getCouplePartner(league, c.id); const p = pid && (league.contestants||[]).find(x=>x.id===pid); return p && <span style={{color:"#e94560",fontSize:10,marginLeft:6}}>♥ {p.name}</span>; })()}
                    {!isMerged&&c.tribe&&<span style={{color:"#4a4a6a",fontSize:10,marginLeft:6}}>{c.tribe}</span>}
                    {c.status==="eliminated"&&<span style={{marginLeft:6,fontSize:10,color:"#e94560"}}>ELIM{c.eliminatedWeek?` ${cadenceShort(league)} ${c.eliminatedWeek}`:""}</span>}
                  </div>
                  {subtitle&&<div style={{fontSize:11,color:"#6a6a8a",marginTop:1}}>{subtitle}</div>}
                </div>
                <div style={{textAlign:"right",minWidth:44}}>
                  <div style={{fontFamily:"'Anybody',sans-serif",fontSize:18,fontWeight:800,color:bigVal>0?"#4ecdc4":bigVal<0?"#e94560":"#6a6a8a"}}>{bigVal>0?"+":""}{formatPts(bigVal, league)}</div>
                  {bigLabel&&<div style={{fontSize:9,color:"#4a4a6a"}}>{bigLabel}</div>}
                </div>
                <div style={{transform:isExp?"rotate(90deg)":"none",transition:"transform 0.15s ease",color:"#4a4a6a"}}><Icon name="chevron" size={14}/></div>
              </div>
              {/* v2.5.2.0: per-episode chip row for multi-episode shows when a
                  draft week is selected. Each chip shows the episode's points
                  and opens the per-episode game log modal on tap. */}
              {epsPerWk > 1 && sortBy.startsWith("week:") && (() => {
                const dw = sortBy.slice(5);
                const eps = draftWeeksGrouped.find(g => g.num === dw)?.episodes || [];
                if (eps.length === 0) return null;
                return (
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,padding:"0 14px 12px",borderTop:"1px solid #1a1a30",paddingTop:10}}>
                    {eps.map(ep => {
                      const pts = c.weeklyTotals?.[ep] || 0;
                      const color = pts > 0 ? "#4ecdc4" : pts < 0 ? "#e94560" : "#6a6a8a";
                      return (
                        <button key={ep} onClick={e=>{e.stopPropagation();setEpisodeModal({ contestantId: c.id, episode: ep });}}
                          style={{
                            padding:"5px 10px",borderRadius:6,border:`1px solid ${color}33`,
                            background:`${color}11`,color:color,fontSize:11,fontWeight:600,
                            cursor:"pointer",fontFamily:"'Outfit',sans-serif",display:"inline-flex",alignItems:"center",gap:6,
                          }}>
                          <span style={{ color:"#8888aa" }}>Ep {ep}</span>
                          <span>{pts>0?"+":""}{formatPts(pts, league)}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
              {isExp&&(<div style={{padding:"0 14px 14px",borderTop:"1px solid #1a1a30"}}>
                {c.bio&&<div style={{color:"#6a6a8a",fontSize:11,padding:"8px 0",lineHeight:1.4}}>{c.bio}</div>}

                {/* Stats summary */}
                {weeks.length>0&&(()=>{
                  let best={wk:null,pts:-Infinity},worst={wk:null,pts:Infinity};
                  weeks.forEach(w=>{const p=c.weeklyTotals[w]||0;if(p>best.pts){best={wk:w,pts:p}}if(p<worst.pts){worst={wk:w,pts:p}}});
                  const lastWkPts=c.weeklyTotals[weeks[weeks.length-1]]||0;
                  return (
                    <div style={{display:"flex",gap:0,marginTop:8,marginBottom:10,borderRadius:8,overflow:"hidden",border:"1px solid #1e1e38"}}>
                      {[
                        {label:`Last ${cadenceShort(league)}`,val:lastWkPts,sub:`${cadenceShort(league)} ${weeks[weeks.length-1]}`,color:lastWkPts>0?"#4ecdc4":lastWkPts<0?"#e94560":"#6a6a8a"},
                        {label:"Best",val:best.pts,sub:best.wk?`${cadenceShort(league)} ${best.wk}`:"—",color:"#f5a623"},
                        {label:"Worst",val:worst.pts,sub:worst.wk?`${cadenceShort(league)} ${worst.wk}`:"—",color:"#e94560"},
                        {label:"Season",val:c.total,sub:`${weeks.length} ${cadenceShort(league).toLowerCase()}s`,color:c.total>0?"#4ecdc4":"#6a6a8a"},
                      ].map(s=>(
                        <div key={s.label} style={{flex:1,padding:"8px 6px",textAlign:"center",background:"#0d0d18",borderRight:"1px solid #1e1e38"}}>
                          <div style={{fontSize:9,color:"#6a6a8a",textTransform:"uppercase",fontWeight:600,marginBottom:2}}>{s.label}</div>
                          <div style={{fontSize:16,fontWeight:800,fontFamily:"'Anybody',sans-serif",color:s.color}}>{s.val>0?"+":""}{formatPts(s.val, league)}</div>
                          <div style={{fontSize:9,color:"#4a4a6a"}}>{s.sub}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Game Log */}
                {weeks.length>0?(<div>
                  <div style={{fontSize:11,fontWeight:600,color:"#6a6a8a",textTransform:"uppercase",marginBottom:6}}>Game Log</div>
                  <div style={{borderRadius:8,border:"1px solid #1e1e38",overflow:"hidden"}}>
                    <div style={{display:"flex",padding:"6px 10px",background:"#0d0d18",borderBottom:"1px solid #1e1e38"}}>
                      <div style={{width:50,fontSize:10,fontWeight:600,color:"#6a6a8a"}}>{cadenceWord(league)}</div>
                      <div style={{flex:1,fontSize:10,fontWeight:600,color:"#6a6a8a"}}>Events</div>
                      <div style={{width:50,textAlign:"right",fontSize:10,fontWeight:600,color:"#6a6a8a"}}>Pts</div>
                    </div>
                    {weeks.map(w=>{
                      const wP=c.weeklyTotals[w]||0;const dets=getWeekDetail(c.id,w);
                      if(wP===0&&dets.length===0)return null;
                      return(<div key={w} style={{display:"flex",alignItems:"flex-start",padding:"8px 10px",borderBottom:"1px solid #1a1a30"}}>
                        <div style={{width:50,fontSize:12,fontWeight:600,color:"#8888aa"}}>{cadenceShort(league)} {w}</div>
                        <div style={{flex:1,display:"flex",flexWrap:"wrap",gap:3}}>
                          {dets.map(d=>(<span key={d.rule.id} style={{fontSize:9,padding:"2px 5px",borderRadius:3,background:d.rule.points>=0?"#4ecdc418":"#e9456018",color:d.rule.points>=0?"#4ecdc4":"#e94560",whiteSpace:"nowrap"}}>{d.rule.label}{d.count>1?` ×${d.count}`:""}</span>))}
                        </div>
                        <div style={{width:50,textAlign:"right",fontWeight:700,fontSize:13,fontFamily:"'Anybody',sans-serif",color:wP>0?"#4ecdc4":wP<0?"#e94560":"#6a6a8a"}}>{wP>0?"+":""}{formatPts(wP, league)}</div>
                      </div>);
                    })}
                  </div>
                </div>):(<div style={{color:"#4a4a6a",fontSize:12,marginTop:8}}>No scores yet.</div>)}
                {!readOnly&&(<div style={{display:"flex",gap:6,marginTop:10}}>
                  <Btn small variant="ghost" onClick={()=>{setEditing(c);setModal("add-contestant")}}><Icon name="edit" size={12}/> Edit</Btn>
                  {!c.photoUrl && <Btn small variant="ghost" onClick={()=>{
                    const url = prompt("Paste a photo URL for " + c.name + ":");
                    if (url && url.trim()) {
                      onUpdate({...league, contestants: league.contestants.map(x=>x.id===c.id?{...x,photoUrl:url.trim(),photoCropY:20}:x)});
                    }
                  }}>Add Photo</Btn>}
                </div>)}
              </div>)}
            </div>);
          })}
        </div>
      )}
      {episodeModal && (() => {
        const c = (league.contestants||[]).find(x => x.id === episodeModal.contestantId);
        if (!c) return null;
        const ep = episodeModal.episode;
        const dets = getWeekDetail(c.id, ep);
        const wP = (league.weeklyScores?.[ep]?.[c.id]) ? Object.values(league.weeklyScores[ep][c.id]).reduce((s,v)=>s+v,0) : 0;
        return (
          <Modal open title={`${c.name} · Episode ${ep}`} onClose={()=>setEpisodeModal(null)}>
            <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
              <ContestantAvatar contestant={c} league={league} size={56} />
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:"#e8e8f0",fontWeight:700,fontFamily:"'Anybody',sans-serif",fontSize:18}}>{c.name}</div>
                <div style={{color:"#6a6a8a",fontSize:12,marginTop:2}}>Episode {ep} game log</div>
              </div>
              <div style={{textAlign:"right",fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:24,color:wP>0?"#4ecdc4":wP<0?"#e94560":"#6a6a8a"}}>
                {wP>0?"+":""}{formatPts(wP, league)}
              </div>
            </div>
            {dets.length === 0 ? (
              <div style={{padding:"20px",textAlign:"center",color:"#6a6a8a",fontSize:13,background:"#12121f",borderRadius:8,border:"1px dashed #2a2a4a"}}>
                No scoring events recorded for this episode.
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {dets.map(d => (
                  <div key={d.rule.id} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",borderRadius:8,background:d.rule.points>=0?"#4ecdc411":"#e9456011",border:`1px solid ${d.rule.points>=0?"#4ecdc433":"#e9456033"}`}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{color:"#e8e8f0",fontSize:13,fontWeight:600}}>{d.rule.label}{d.count>1?` ×${d.count}`:""}</div>
                      {d.rule.description && <div style={{color:"#8888aa",fontSize:11,marginTop:3,lineHeight:1.4}}>{d.rule.description}</div>}
                    </div>
                    <div style={{fontFamily:"'Anybody',sans-serif",fontWeight:700,fontSize:14,color:d.rule.points>=0?"#4ecdc4":"#e94560",flexShrink:0}}>
                      {d.pts>0?"+":""}{formatPts(d.pts, league)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Modal>
        );
      })()}
    </div>
  );
}

// Parse pasted text into a list of {name, bio} records. Three strategies, in order:
//   0. Love Island press-kit: lines tagged Name:/Age:/Job:/From: — one record per Name:.
//   1. Bravo cast-page: blocks bounded by Hometown:/Occupation:.
//   2. Simple list: one name per line, optionally "Name - bio". Tightened to reject prose
//      (lines >80 chars, lines ending with ?, all-lowercase starts, >5-word "names").
// Returns an array of { name, bio }. Pure function — no React, no Firebase.
function parseContestantsFromText(rawText) {
  const text = (rawText || "").trim();
  if (!text) return [];
  const contestants = [];
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  const hasNameKey = lines.some(l => /^Name:\s*/i.test(l));
  if (hasNameKey) {
    let cur = null;
    const flush = () => {
      if (!cur || !cur.name) return;
      const bio = [cur.age && `Age ${cur.age}`, cur.job, cur.from && `From ${cur.from}`].filter(Boolean).join(" · ");
      contestants.push({ name: cur.name, bio });
    };
    for (const line of lines) {
      const mName = line.match(/^Name:\s*(.+)$/i);
      if (mName) { flush(); cur = { name: mName[1].trim(), age:"", job:"", from:"" }; continue; }
      if (!cur) continue;
      const mAge  = line.match(/^Age:\s*(.+)$/i);                              if (mAge)  { cur.age  = mAge[1].trim();  continue; }
      const mJob  = line.match(/^(?:Job|Occupation|Profession):\s*(.+)$/i);    if (mJob)  { cur.job  = mJob[1].trim();  continue; }
      const mFrom = line.match(/^(?:From|Hometown|Location):\s*(.+)$/i);       if (mFrom) { cur.from = mFrom[1].trim(); continue; }
    }
    flush();
    return contestants;
  }

  const hasBravoFormat = lines.some(l => l.startsWith("Hometown:"));
  if (hasBravoFormat) {
    let currentName = null;
    let hometown = ""; let city = ""; let occupation = "";
    for (const line of lines) {
      if (line.startsWith("Photo:") || line.startsWith("RELATED:") || line.startsWith("How to Watch")) continue;
      if (line.startsWith("Hometown:")) {
        hometown = line.replace("Hometown:", "").trim();
      } else if (line.startsWith("Current City of Residence:") || line.startsWith("Current city of residence:") || line.startsWith("Current Residence:")) {
        city = line.replace(/Current.*?:/i, "").trim();
      } else if (line.startsWith("Occupation/Profession:") || line.startsWith("Occupation:")) {
        occupation = line.replace(/Occupation.*?:/i, "").trim();
        if (currentName) {
          const bio = [city || hometown, occupation].filter(Boolean).join(" · ");
          contestants.push({ name: currentName, bio });
        }
        currentName = null;
        hometown = ""; city = ""; occupation = "";
      } else if (
        line.length < 60 && line.length > 3 &&
        !line.startsWith("Born") && !line.startsWith("After") && !line.startsWith("A ") &&
        !line.startsWith("Every") && !line.startsWith("For ") && !line.startsWith("Food") &&
        !line.startsWith("Known") && !line.startsWith("Get ") && !line.startsWith("Want ") &&
        !line.startsWith("Fans ") && !line.includes("Season") && !line.includes("cheftestant") &&
        !line.includes("competing") && !line.includes("restaurant") &&
        /^[A-Z]/.test(line) && (line.split(" ").length <= 5) &&
        !hometown && !city && !occupation
      ) {
        currentName = line.replace(/[""]/g, '"');
        hometown = ""; city = ""; occupation = "";
      }
    }
    return contestants;
  }

  const separators = [" - ", " – ", " — ", " | ", "\t"];
  for (const line of lines) {
    if (line.length > 80) continue;
    if (/[?]$/.test(line)) continue;
    if (/^[a-z]/.test(line)) continue;
    let name = line, bio = "";
    for (const sep of separators) {
      if (line.includes(sep)) {
        const parts = line.split(sep);
        name = parts[0].trim();
        bio = parts.slice(1).join(sep).trim();
        break;
      }
    }
    const nameWords = name.split(/\s+/).filter(Boolean);
    if (nameWords.length === 0 || nameWords.length > 5) continue;
    if (name.length < 2 || name.length > 79) continue;
    contestants.push({ name, bio });
  }
  return contestants;
}

// Merge parsed { name, bio } records into league.contestants. Skips records
// whose generated id collides with an existing contestant (idempotent re-runs).
// Returns the updated league object; caller persists via onUpdate.
function mergeParsedContestants(league, parsed) {
  if (!parsed || parsed.length === 0) return league;
  const existing = league.contestants || [];
  const next = [...existing];
  for (const p of parsed) {
    const id = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, "");
    if (!next.find(c => c.id === id)) {
      const parts = p.name.split(" ");
      const shortName = parts.length > 1
        ? parts[0] + " " + parts[parts.length - 1][0] + "."
        : parts[0];
      next.push({
        id,
        name: shortName,
        bio: (p.name !== shortName ? p.name + " · " : "") + p.bio,
        gender: "",
        status: "active",
      });
    }
  }
  return { ...league, contestants: next };
}

// Bulk-add UI body — embedded inside AddContestantModal when its mode === "bulk".
// Returns just the body markup (no modal wrapper) so it composes inside the
// shared modal shell. Closes the modal once Add is committed.
function BulkAddBody({ league, onUpdate, onClose }) {
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState(null);

  function parseText() {
    setParsed(parseContestantsFromText(rawText));
  }
  function applyBulk() {
    if (!parsed || parsed.length === 0) return;
    onUpdate(mergeParsedContestants(league, parsed));
    onClose();
  }

  return (
    <div>
      <div style={{ fontSize:12,color:"#6a6a8a",marginBottom:12,lineHeight:1.4 }}>
        Paste text from a press kit or a simple list. Recognized formats: Love Island press kits with <code>Name:</code> / <code>Age:</code> / <code>Job:</code> / <code>From:</code> labels (one record per <code>Name:</code>); Bravo-style cast pages with <code>Hometown:</code> / <code>Occupation:</code>; or a plain list (one name per line, optionally <code>Name - bio</code>).
      </div>
      <textarea value={rawText} onChange={e=>setRawText(e.target.value)} placeholder="Paste cast page text or name list here..." rows={8} style={{
        width:"100%",padding:"10px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:8,
        color:"#e8e8f0",fontSize:13,fontFamily:"'Outfit',sans-serif",resize:"vertical",marginBottom:10,boxSizing:"border-box",
      }} />
      <Btn small onClick={parseText} disabled={!rawText.trim()} style={{ marginBottom:12 }}>Parse</Btn>
        {parsed && (
          <div>
            <div style={{ fontSize:12,fontWeight:600,color:parsed.length>0?"#4ecdc4":"#e94560",marginBottom:8 }}>
              Found {parsed.length} contestant{parsed.length!==1?"s":""}
            </div>
            {parsed.length > 0 && (
              <div style={{ maxHeight:200,overflow:"auto",background:"#0d0d18",borderRadius:6,padding:8,marginBottom:12 }}>
                {parsed.map((c,i) => (
                  <div key={i} style={{ padding:"4px 0",borderBottom:"1px solid #1a1a30" }}>
                    <div style={{ color:"#e8e8f0",fontSize:12,fontWeight:600 }}>{c.name}</div>
                    {c.bio && <div style={{ color:"#6a6a8a",fontSize:10,marginTop:1 }}>{c.bio}</div>}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display:"flex",gap:8 }}>
              <Btn small onClick={applyBulk} disabled={parsed.length===0}>Add {parsed.length} Contestant{parsed.length!==1?"s":""}</Btn>
              <Btn small variant="ghost" onClick={onClose}>Cancel</Btn>
            </div>
          </div>
        )}
    </div>
  );
}

function TeamCardActions({ team, league, onUpdate, setEditing, setModal }) {
  const [copiedCode, setCopiedCode] = useState(null);
  const [showCode, setShowCode] = useState(false);
  const [registeredUser, setRegisteredUser] = useState(null);
  const [checkingReg, setCheckingReg] = useState(true);

  const inviteCodes = league.inviteCodes || {};
  const usedCodes = league.usedCodes || [];
  const code = inviteCodes[team.id];

  // Check if any Firebase Auth user is activated for this team
  useEffect(() => {
    (async () => {
      try {
        const { loadAllUserProfiles } = await import("./firebase.js");
        const profiles = await loadAllUserProfiles();
        const found = Object.values(profiles || {}).find(p =>
          p.activations && Object.entries(p.activations).some(([lid, tid]) => lid === league.id && tid === team.id)
        );
        setRegisteredUser(found || null);
      } catch {}
      setCheckingReg(false);
    })();
  }, [league.id, team.id]);

  const hasRegistration = !!registeredUser;

  function generateCode() {
    return generateInviteCode();
  }

  function genOrRegenCode() {
    const newCode = generateCode();
    const newCodes = { ...inviteCodes, [team.id]: newCode };
    const newUsed = usedCodes.filter(c => c !== inviteCodes[team.id]);
    onUpdate({ ...league, inviteCodes: newCodes, usedCodes: newUsed });
    setShowCode(true);
  }

  function resetRegistration() {
    if (!confirm(`Reset registration for ${team.name}? They will need a new invite code to rejoin.`)) return;
    const newCodes = { ...inviteCodes };
    delete newCodes[team.id];
    onUpdate({ ...league, inviteCodes: newCodes });
  }

  function copyCode() {
    const c = inviteCodes[team.id];
    if (!c) return;
    const text = c;
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }).catch(() => {});
  }

  return (
    <div style={{ marginTop:10 }}>
      <div style={{ display:"flex",gap:6,alignItems:"center",flexWrap:"wrap" }}>
        <Btn small variant="ghost" onClick={()=>{setEditing(team);setModal("add-team")}}><Icon name="edit" size={12}/> Edit</Btn>
        <Btn small variant="danger" onClick={()=>{ if(confirm("Delete team?")) onUpdate({...league,teams:league.teams.filter(t=>t.id!==team.id)}); }}><Icon name="trash" size={12}/> Delete</Btn>
        {checkingReg ? (
          <Badge color="#6a6a8a">Checking...</Badge>
        ) : hasRegistration ? (
          <>
            <Badge color="#4ecdc4">Registered ✓{registeredUser?.displayName ? ` (${registeredUser.displayName})` : ""}</Badge>
            <Btn small variant="ghost" onClick={async ()=>{
              if (!confirm(`Remove ${registeredUser?.displayName || "this user"} from ${team.name} and generate a new invite code? They'll lose access and you can send the code to someone else.`)) return;
              // Unlink their activation
              const { loadAllUserProfiles, saveUserProfile } = await import("./firebase.js");
              const profiles = await loadAllUserProfiles();
              const uid = Object.entries(profiles||{}).find(([,p]) =>
                p.activations && Object.entries(p.activations).some(([lid, tid]) => lid === league.id && tid === team.id)
              )?.[0];
              if (uid) {
                const profile = profiles[uid];
                const newActivations = { ...(profile.activations||{}) };
                delete newActivations[league.id];
                await saveUserProfile(uid, { ...profile, activations: newActivations });
              }
              setRegisteredUser(null);
              // Generate new invite code
              genOrRegenCode();
            }}>Reassign</Btn>
          </>
        ) : (
          <Btn small variant="secondary" onClick={genOrRegenCode}>
            {code ? "Regenerate Code" : "Generate Invite"}
          </Btn>
        )}
      </div>
      {!hasRegistration && code && (
        <div style={{ marginTop:8 }}>
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <div style={{ fontSize:11,color:"#6a6a8a" }}>Invite code for {team.owner}:</div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:4 }}>
            <div style={{
              flex:1,padding:"8px 12px",background:"#0d0d18",borderRadius:6,
              fontFamily:"monospace",fontSize:16,color:"#e8e8f0",letterSpacing:"0.15em",
              textAlign:"center",fontWeight:700,
            }}>{code}</div>
            <Btn small variant={copiedCode?"success":"ghost"} onClick={copyCode}>
              {copiedCode ? "✓ Copied" : "Copy"}
            </Btn>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:6,marginTop:6 }}>
              <div style={{ flex:1,padding:"6px 10px",background:"#0d0d18",borderRadius:6,fontSize:11,
                color:"#6a6a8a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                {"https://app.fantasyrealitytv.com?join=" + code}
              </div>
              <Btn small variant="ghost" onClick={()=>navigator.clipboard?.writeText("https://app.fantasyrealitytv.com?join=" + code)}>Copy Link</Btn>
            </div>
        </div>
      )}
    </div>
  );
}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ScoringTab({ league, onUpdate, isCommissioner = true, userProfile }) {
  const [selectedWeek, setSelectedWeek] = useState(String(league.currentWeek||1));
  const [edits, setEdits] = useState({});
  const [selectedRule, setSelectedRule] = useState(null);
  const [view, setView] = useState(onUpdate ? "events" : "summary"); // "events" | "assign" | "summary" | "rules"

  const weekScores = league.weeklyScores?.[selectedWeek] || {};
  const isWeekFinalized = league.weekStatus?.[selectedWeek]?.status === "finalized";
  const weekContestants = (league.contestants||[]).filter(c => {
    if (c.status !== "eliminated") return true;
    if (c.eliminatedWeek && Number(selectedWeek) <= c.eliminatedWeek) return true;
    return false;
  });
  const tribes = league.tribes || {};
  const tribeNames = Object.keys(tribes);
  const isMerged = league.merged || false;

  // Compute hasChanges from whether edits actually differ from saved
  const hasChanges = useMemo(() => {
    if (Object.keys(edits).length === 0) return false;
    for (const cid of Object.keys(edits)) {
      const saved = weekScores[cid] || {};
      const edited = edits[cid] || {};
      for (const key of Object.keys(edited)) {
        if ((edited[key] || 0) !== (saved[key] || 0)) return true;
      }
    }
    return false;
  }, [edits, weekScores]);

  // Merge saved + edits for a contestant
  function getMerged(cid) {
    return { ...(weekScores[cid]||{}), ...(edits[cid]||{}) };
  }

  function getCount(cid, ruleId, rulePoints) {
    const val = getMerged(cid)[ruleId] || 0;
    if (val === 0 || rulePoints === 0) return 0;
    return Math.round(val / rulePoints);
  }

  function setScore(cid, ruleId, rulePoints, count) {
    setEdits(prev=>({ ...prev, [cid]: { ...(prev[cid]||weekScores[cid]||{}), [ruleId]: count * rulePoints } }));
  }

  function toggleContestant(cid, rule) {
    const count = getCount(cid, rule.id, rule.points);
    setScore(cid, rule.id, rule.points, count === 0 ? 1 : 0);
  }

  function toggleTribe(tribeName, rule) {
    const memberIds = (tribes[tribeName]||[]).filter(id => weekContestants.some(c=>c.id===id));
    const allActive = memberIds.every(id => getCount(id, rule.id, rule.points) > 0);
    memberIds.forEach(id => setScore(id, rule.id, rule.points, allActive ? 0 : 1));
  }

  function selectAllActive(rule) {
    const allActive = weekContestants.every(c => getCount(c.id, rule.id, rule.points) > 0);
    weekContestants.forEach(c => setScore(c.id, rule.id, rule.points, allActive ? 0 : 1));
  }

  function saveScores() {
    const weekKey = selectedWeek;
    const mergedWeek = { ...weekScores, ...edits };
    const merged = { ...(league.weeklyScores||{}), [weekKey]: mergedWeek };
    // v2.6.1.0: log score saves so league members see when scoring happened.
    const actorName = userProfile?.displayName || "Commissioner";
    const auditEntry = { type: "scoring", actorName, desc: `${actorName} updated scoring for ${cadenceLabel(league, weekKey)}`, meta: { week: weekKey } };

    // v2.4.49.0: eliminate-on-score. When commissioner scores any rule flagged
    // `isElimination: true` for a contestant in this week, auto-set the
    // contestant's status to "eliminated" with `eliminatedWeek = selectedWeek`.
    // If the contestant was previously marked eliminated THIS SAME WEEK and
    // those rules have since been undone (all elim counts now 0), revert to
    // active. Contestants eliminated in a DIFFERENT week are never touched.
    const elimRuleIds = new Set((league.scoringRules || []).filter(r => r.isElimination).map(r => r.id));
    const wkNum = Number(weekKey);
    const nextContestants = (league.contestants || []).map(c => {
      if (elimRuleIds.size === 0) return c;
      const cWk = mergedWeek[c.id] || {};
      const hasElim = [...elimRuleIds].some(id => (cWk[id] || 0) !== 0);
      if (hasElim) {
        if (c.status === "eliminated" && c.eliminatedWeek === wkNum) return c;
        return { ...c, status: "eliminated", eliminatedWeek: wkNum };
      }
      if (c.status === "eliminated" && c.eliminatedWeek === wkNum) {
        return { ...c, status: "active", eliminatedWeek: null };
      }
      return c;
    });

    const audited = appendAudit(league, auditEntry);
    onUpdate({ ...audited, weeklyScores: merged, contestants: nextContestants });
    setEdits({});
  }

  function discardChanges() {
    setEdits({});
  }

  function reverseWeek() {
    if ((league.currentWeek||1) <= 1) return;
    if (!confirm("Go back to " + cadenceLabel(league, (league.currentWeek||1)-1) + "? This won't delete any scoring data — it just moves the current " + cadenceWord(league).toLowerCase() + " pointer back.")) return;
    // Don't touch linked leagues — only adjust this league's week
    onUpdate({ ...league, currentWeek: (league.currentWeek||1) - 1 });
  }

  function advanceWeek() {
    const nextWeek = (league.currentWeek||1) + 1;
    const currentWk = String(league.currentWeek||1);
    let updatedTeams = league.teams;
    if (league.format === "captains") {
      updatedTeams = league.teams.map(t => ({
        ...t,
        weeklyDepthCharts: { ...(t.weeklyDepthCharts||{}), [nextWeek]: { ...(t.depthChart||{}) } },
      }));
    }

    // Auto-eliminate: check if any contestant was scored with an "eliminated" rule this week
    const weekScoresNow = { ...weekScores, ...edits };
    const eliminatedRule = (league.scoringRules||[]).find(r => r.id === "eliminated" || r.label?.toLowerCase().includes("eliminated"));
    let updatedContestants = league.contestants || [];
    if (eliminatedRule) {
      const elimIds = [];
      Object.entries(weekScoresNow).forEach(([cid, scores]) => {
        if (scores[eliminatedRule.id] && scores[eliminatedRule.id] !== 0) {
          elimIds.push(cid);
        }
      });
      if (elimIds.length > 0) {
        updatedContestants = updatedContestants.map(c =>
          elimIds.includes(c.id) && c.status !== "eliminated"
            ? { ...c, status: "eliminated", eliminatedWeek: Number(currentWk) }
            : c
        );
      }
    }

    let updated = { ...league, currentWeek: nextWeek, teams: updatedTeams, contestants: updatedContestants };
    updated = ensureEpisode(updated, nextWeek);
    onUpdate(updated);
  }

  // Group scoring rules by category
  const rulesByCategory = {};
  (league.scoringRules||[]).forEach(r => {
    const cat = r.category || "Other";
    if (!rulesByCategory[cat]) rulesByCategory[cat] = [];
    rulesByCategory[cat].push(r);
  });

  // Count how many contestants have scores for a given rule this week
  function countAssigned(rule) {
    return weekContestants.filter(c => getCount(c.id, rule.id, rule.points) > 0).length;
  }

  // Summary: all contestants with any score this week
  function getSummary() {
    return weekContestants.map(c => {
      const merged = getMerged(c.id);
      const events = [];
      (league.scoringRules||[]).forEach(r => {
        const count = getCount(c.id, r.id, r.points);
        if (count > 0) events.push({ rule: r, count, pts: Math.round(count * r.points * 100) / 100 });
      });
      const total = Math.round(Object.values(merged).reduce((s,v)=>s+v,0) * 10) / 10;
      return { ...c, events, total };
    }).filter(c => c.events.length > 0 || c.total !== 0).sort((a,b) => b.total - a.total);
  }

  const rule = selectedRule ? (league.scoringRules||[]).find(r=>r.id===selectedRule) : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8 }}>
        <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>
          {view === "events" ? `Score ${cadenceWord(league)}` : view === "assign" ? "" : view === "rules" ? "Scoring Rules" : `${cadenceWord(league)} Summary`}
        </h3>
        <Select value={selectedWeek} onChange={e=>{setSelectedWeek(e.target.value);setEdits({});setView(onUpdate?"events":"summary");setSelectedRule(null)}}
          options={Array.from({length: onUpdate ? Math.max(league.currentWeek||1,1)+2 : Math.max(league.currentWeek||1,1)},(_,i)=>({value:String(i+1),label:cadenceLabel(league, i+1)}))} />
      </div>

      {/* View tabs */}
      <div style={{ display:"flex",gap:6,marginBottom:16 }}>
        {[
          ...(onUpdate ? [{id:"events",label:"Score Events"}] : []),
          {id:"summary",label:"Summary"},
          ...(!onUpdate ? [{id:"rules",label:"Scoring Rules"}] : []),
        ].map(t=>(
          <button key={t.id} onClick={()=>{setView(t.id);setSelectedRule(null)}} style={{
            padding:"6px 14px",borderRadius:99,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,
            background:view===t.id||(view==="assign"&&t.id==="events")?"#e9456033":"#1e1e38",
            color:view===t.id||(view==="assign"&&t.id==="events")?"#e94560":"#8888aa",fontFamily:"'Outfit',sans-serif",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ─── FINALIZED WEEK LOCKED BANNER ─── */}
      {isWeekFinalized && onUpdate && (
        <div style={{ padding:"10px 14px",background:"#4ecdc411",borderRadius:8,border:"1px solid #4ecdc433",marginBottom:16,
          display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div style={{ fontSize:12,color:"#4ecdc4",fontWeight:600 }}>
            🔒 {cadenceLabel(league, selectedWeek)} is finalized. Scoring is locked.
          </div>
          <Btn small variant="ghost" onClick={() => {
            if (!confirm(`Unfinalize ${cadenceLabel(league, selectedWeek)}? This will re-open scoring and disable spoiler protection for this ${cadenceWord(league).toLowerCase()}.`)) return;
            // Backfill episode metadata BEFORE deleting weekStatus so finalizedAt is still readable.
            let updated = ensureEpisode(league, selectedWeek);
            const updatedStatus = { ...(updated.weekStatus || {}) };
            delete updatedStatus[String(selectedWeek)];
            onUpdate({ ...updated, weekStatus: updatedStatus });
          }}>Unfinalize</Btn>
        </div>
      )}

      {/* ─── ADVANCE NUDGE BANNER ─── */}
      {/* Keyed to currentWeek (not selectedWeek) so the nudge persists even when commissioner navigates to a prior week. Disappears on advance or unfinalize. */}
      {onUpdate && league.weekStatus?.[String(league.currentWeek||1)]?.status === "finalized" && (
        <div style={{ padding:"10px 14px",background:"#e9456011",borderRadius:8,border:"1px solid #e9456033",marginBottom:16,
          display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap" }}>
          <div style={{ fontSize:12,color:"#e94560",fontWeight:600 }}>
            {cadenceLabel(league, league.currentWeek||1)} finalized. Score {cadenceLabel(league, (league.currentWeek||1)+1)} next →
          </div>
          <Btn small onClick={advanceWeek}>Advance</Btn>
        </div>
      )}

      {/* ─── EVENT LIST VIEW ─── */}
      {view === "events" && onUpdate && (
        <div>
          {league.format==="captains" && (
            <div style={{ padding:"8px 12px",background:"#f5a62311",borderRadius:8,border:"1px solid #f5a62333",marginBottom:14,fontSize:11,color:"#f5a623" }}>
              Enter base points here. Hero (2×) and Side-Kick (1.5×) multipliers apply automatically.
            </div>
          )}
          {Object.entries(rulesByCategory).map(([cat, rules]) => (
            <div key={cat} style={{ marginBottom:16 }}>
              <div style={{ fontSize:11,fontWeight:700,color:"#6a6a8a",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8 }}>{cat}</div>
              <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                {rules.map(r => {
                  const assigned = countAssigned(r);
                  return (
                    <button key={r.id} onClick={()=>{setSelectedRule(r.id);setView("assign")}} style={{
                      display:"flex",alignItems:"center",justifyContent:"space-between",
                      padding:"14px 16px",background:"#12121f",border:"1px solid #1e1e38",borderRadius:10,
                      cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all 0.1s ease",
                      textAlign:"left",
                    }} onMouseEnter={e=>{e.currentTarget.style.borderColor="#3a3a5a"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#1e1e38"}}>
                      <div style={{ flex:1,minWidth:0,marginRight:8 }}>
                        <div style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>{r.label}</div>
                        {r.description && (
                          <div style={{ fontSize:11,color:"#8888aa",marginTop:3,lineHeight:1.4 }}>{r.description}</div>
                        )}
                        <div style={{ fontSize:11,color:r.points>=0?"#4ecdc4":"#e94560",marginTop:3 }}>
                          {r.points>0?"+":""}{formatPts(r.points, league)} pts{r.points===-1||r.points===1?" each":""}
                        </div>
                      </div>
                      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                        {assigned > 0 && (
                          <span style={{ fontSize:12,fontWeight:700,color:"#4ecdc4",background:"#4ecdc422",padding:"2px 8px",borderRadius:99 }}>
                            {assigned}
                          </span>
                        )}
                        <Icon name="chevron" size={14}/>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── ASSIGN CONTESTANTS VIEW ─── */}
      {view === "assign" && rule && onUpdate && (
        <div>
          <button onClick={()=>{setView("events");setSelectedRule(null)}} style={{
            background:"none",border:"none",color:"#8888aa",cursor:"pointer",padding:"4px 0",
            fontSize:13,fontFamily:"'Outfit',sans-serif",display:"flex",alignItems:"center",gap:4,marginBottom:12,
          }}>
            <Icon name="back" size={16}/> Back to events
          </button>

          <div style={{
            padding:"14px 16px",borderRadius:10,marginBottom:16,
            background:rule.points>=0?"#4ecdc411":"#e9456011",
            border:rule.points>=0?"1px solid #4ecdc433":"1px solid #e9456033",
          }}>
            <div style={{ color:"#e8e8f0",fontWeight:700,fontSize:16,fontFamily:"'Anybody',sans-serif" }}>{rule.label}</div>
            {rule.description && (
              <div style={{ color:"#aaaabf",fontSize:12,marginTop:6,lineHeight:1.5 }}>{rule.description}</div>
            )}
            <div style={{ color:rule.points>=0?"#4ecdc4":"#e94560",fontSize:13,marginTop:6 }}>
              {rule.points>0?"+":""}{formatPts(rule.points, league)} pts per occurrence
            </div>
          </div>

          {/* Tribe quick-select buttons */}
          {tribeNames.length > 0 && !isMerged && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11,fontWeight:600,color:"#6a6a8a",textTransform:"uppercase",marginBottom:6 }}>Quick Select</div>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                {tribeNames.map(tribe => {
                  const memberIds = (tribes[tribe]||[]).filter(id => weekContestants.some(c=>c.id===id));
                  const allOn = memberIds.length > 0 && memberIds.every(id => getCount(id, rule.id, rule.points) > 0);
                  const tribeColor = (league.tribeColors||{})[tribe] || "#ccc";
                  return (
                    <button key={tribe} onClick={()=>{ if (!isWeekFinalized) toggleTribe(tribe, rule); }} style={{
                      padding:"7px 14px",borderRadius:8,border:allOn?`2px solid ${tribeColor}`:"2px solid transparent",
                      cursor:isWeekFinalized?"not-allowed":"pointer",opacity:isWeekFinalized?0.4:1,fontSize:12,fontWeight:700,
                      background:allOn?tribeColor+"33":"#1e1e38",color:allOn?tribeColor:"#ccc",
                      fontFamily:"'Outfit',sans-serif",transition:"all 0.1s ease",
                      display:"flex",alignItems:"center",gap:6,
                    }}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:tribeColor,flexShrink:0}}></span>
                      {allOn ? "✓ " : ""}{tribe} ({memberIds.length})
                    </button>
                  );
                })}
                <button onClick={()=>{ if (!isWeekFinalized) selectAllActive(rule); }} style={{
                  padding:"7px 14px",borderRadius:8,border:"1px solid #2a2a4a",
                  cursor:isWeekFinalized?"not-allowed":"pointer",opacity:isWeekFinalized?0.4:1,fontSize:12,fontWeight:600,
                  background:"transparent",color:"#8888aa",fontFamily:"'Outfit',sans-serif",
                }}>
                  {weekContestants.every(c => getCount(c.id, rule.id, rule.points) > 0) ? "Deselect All" : "Select All"}
                </button>
              </div>
            </div>
          )}

          {/* Contestant list grouped by tribe */}
          {tribeNames.length > 0 && !isMerged ? tribeNames.map(tribe => {
            const members = weekContestants.filter(c => c.tribe === tribe).sort((a,b) => a.name.localeCompare(b.name));
            if (members.length === 0) return null;
            return (
              <div key={tribe} style={{ marginBottom:12 }}>
                <div style={{ fontSize:11,fontWeight:700,color:"#6a6a8a",textTransform:"uppercase",marginBottom:4,letterSpacing:"0.05em" }}>{tribe}</div>
                <div style={{ display:"flex",flexDirection:"column",gap:3 }}>
                  {members.map(c => {
                    const count = getCount(c.id, rule.id, rule.points);
                    const isOn = count > 0;
                    return (
                      <div key={c.id} style={{
                        display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,
                        background:isOn?(rule.points>=0?"#4ecdc418":"#e9456018"):"#12121f",
                        border:isOn?(rule.points>=0?"1px solid #4ecdc433":"1px solid #e9456033"):"1px solid #1e1e38",
                        transition:"all 0.1s ease",
                      }}>
                        <button onClick={()=>{ if (!isWeekFinalized) toggleContestant(c.id, rule); }} style={{
                          width:32,height:32,borderRadius:8,border:isOn?"none":"2px solid #3a3a5a",
                          cursor:isWeekFinalized?"not-allowed":"pointer",opacity:isWeekFinalized?0.4:1,
                          background:isOn?(rule.points>=0?"#4ecdc4":"#e94560"):"transparent",
                          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                        }}>
                          {isOn && <Icon name="check" size={14}/>}
                        </button>
                        <div style={{ flex:1,cursor:isWeekFinalized?"default":"pointer" }} onClick={()=>{ if (!isWeekFinalized) toggleContestant(c.id, rule); }}>
                          <span style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>{c.name}</span>
                        </div>
                        {isOn && (
                          <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                            <button onClick={()=>{ if (!isWeekFinalized) setScore(c.id,rule.id,rule.points,Math.max(0,count-1)); }} style={{
                              width:32,height:32,borderRadius:8,border:"1px solid #2a2a4a",background:"#1e1e38",
                              color:"#ccc",cursor:isWeekFinalized?"not-allowed":"pointer",opacity:isWeekFinalized?0.4:1,fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",
                            }}>−</button>
                            <span style={{ color:"#e8e8f0",fontWeight:700,fontSize:14,minWidth:20,textAlign:"center" }}>{count}</span>
                            <button onClick={()=>{ if (!isWeekFinalized) setScore(c.id,rule.id,rule.points,count+1); }} style={{
                              width:32,height:32,borderRadius:8,border:"1px solid #2a2a4a",background:"#1e1e38",
                              color:"#ccc",cursor:isWeekFinalized?"not-allowed":"pointer",opacity:isWeekFinalized?0.4:1,fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",
                            }}>+</button>
                            <span style={{ color:rule.points>=0?"#4ecdc4":"#e94560",fontSize:12,fontWeight:600,minWidth:40,textAlign:"right" }}>
                              {(count*rule.points)>0?"+":""}{formatPts(count*rule.points, league)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }) : (
            /* No tribes — flat list */
            <div style={{ display:"flex",flexDirection:"column",gap:3 }}>
              {[...weekContestants].sort((a,b) => a.name.localeCompare(b.name)).map(c => {
                const count = getCount(c.id, rule.id, rule.points);
                const isOn = count > 0;
                return (
                  <div key={c.id} style={{
                    display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,
                    background:isOn?(rule.points>=0?"#4ecdc418":"#e9456018"):"#12121f",
                    border:isOn?(rule.points>=0?"1px solid #4ecdc433":"1px solid #e9456033"):"1px solid #1e1e38",
                  }}>
                    <button onClick={()=>{ if (!isWeekFinalized) toggleContestant(c.id, rule); }} style={{
                      width:32,height:32,borderRadius:8,border:isOn?"none":"2px solid #3a3a5a",
                      cursor:isWeekFinalized?"not-allowed":"pointer",opacity:isWeekFinalized?0.4:1,
                      background:isOn?(rule.points>=0?"#4ecdc4":"#e94560"):"transparent",
                      display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                    }}>
                      {isOn && <Icon name="check" size={14}/>}
                    </button>
                    <div style={{ flex:1,cursor:isWeekFinalized?"default":"pointer" }} onClick={()=>{ if (!isWeekFinalized) toggleContestant(c.id, rule); }}>
                      <span style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>{c.name}</span>
                    </div>
                    {isOn && (
                      <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                        <button onClick={()=>{ if (!isWeekFinalized) setScore(c.id,rule.id,rule.points,Math.max(0,count-1)); }} style={{
                          width:32,height:32,borderRadius:8,border:"1px solid #2a2a4a",background:"#1e1e38",
                          color:"#ccc",cursor:isWeekFinalized?"not-allowed":"pointer",opacity:isWeekFinalized?0.4:1,fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",
                        }}>−</button>
                        <span style={{ color:"#e8e8f0",fontWeight:700,fontSize:14,minWidth:20,textAlign:"center" }}>{count}</span>
                        <button onClick={()=>{ if (!isWeekFinalized) setScore(c.id,rule.id,rule.points,count+1); }} style={{
                          width:32,height:32,borderRadius:8,border:"1px solid #2a2a4a",background:"#1e1e38",
                          color:"#ccc",cursor:isWeekFinalized?"not-allowed":"pointer",opacity:isWeekFinalized?0.4:1,fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",
                        }}>+</button>
                        <span style={{ color:rule.points>=0?"#4ecdc4":"#e94560",fontSize:12,fontWeight:600,minWidth:40,textAlign:"right" }}>
                          {(count*rule.points)>0?"+":""}{formatPts(count*rule.points, league)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop:16 }}>
            <Btn variant="ghost" onClick={()=>{setView("events");setSelectedRule(null)}} style={{ width:"100%",justifyContent:"center" }}>
              ← Done with {rule.label}
            </Btn>
          </div>
        </div>
      )}

      {/* ─── SUMMARY VIEW ─── */}
      {view === "summary" && (
        <div>
          {getSummary().length === 0 ? <EmptyState message={`No scores entered for this ${cadenceWord(league).toLowerCase()} yet.`} /> : (
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {getSummary().map(c => (
                <div key={c.id} style={{ padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
                    <div>
                      <span style={{ color:"#e8e8f0",fontWeight:700,fontSize:14 }}>{c.name}</span>
                      {c.tribe && <span style={{ color:"#6a6a8a",fontSize:11,marginLeft:6 }}>{c.tribe}</span>}
                    </div>
                    <span style={{ fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,
                      color:c.total>0?"#4ecdc4":c.total<0?"#e94560":"#6a6a8a" }}>
                      {c.total>0?"+":""}{formatPts(c.total, league)}
                    </span>
                  </div>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
                    {c.events.map(e => (
                      <span key={e.rule.id} style={{
                        fontSize:11,padding:"2px 8px",borderRadius:4,
                        background:e.rule.points>=0?"#4ecdc422":"#e9456022",
                        color:e.rule.points>=0?"#4ecdc4":"#e94560",
                      }}>
                        {e.rule.label}{e.count>1?` ×${e.count}`:""} ({e.pts>0?"+":""}{formatPts(e.pts, league)})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── SCORING RULES VIEW (read-only for non-commissioners) ─── */}
      {view === "rules" && (
        <div>
          {Object.entries(rulesByCategory).map(([cat, rules]) => (
            <div key={cat} style={{ marginBottom:16 }}>
              <div style={{ fontSize:11,fontWeight:700,color:"#6a6a8a",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8 }}>{cat}</div>
              <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                {rules.map(r => (
                  <div key={r.id} style={{
                    display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"12px 16px",background:"#12121f",border:"1px solid #1e1e38",borderRadius:10,
                  }}>
                    <span style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>{r.label}</span>
                    <Badge color={r.points>=0?"#4ecdc4":"#e94560"}>{r.points>0?"+":""}{formatPts(r.points, league)}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save / Advance buttons */}
      {onUpdate && (hasChanges && !isWeekFinalized ? (
        <div style={{ position:"sticky",bottom:16,marginTop:20,padding:"14px 16px",background:"linear-gradient(135deg,#1a0a10,#12121f)",borderRadius:14,border:"1px solid #e94560",
          display:"flex",gap:10,justifyContent:"center",alignItems:"center",boxShadow:"0 -4px 24px rgba(233,69,96,0.2)" }}>
          <Btn small variant="ghost" onClick={discardChanges}>Discard</Btn>
          <Btn onClick={saveScores}><Icon name="save" size={14}/> Save {cadenceLabel(league, selectedWeek)}</Btn>
        </div>
      ) : (
        <div style={{ display:"flex",gap:8,marginTop:20,flexWrap:"wrap" }}>
          {(league.currentWeek||1) > 1 && <Btn variant="ghost" onClick={reverseWeek} small>← Back to {cadenceLabel(league, (league.currentWeek||1)-1)}</Btn>}
          <Btn variant="secondary" onClick={advanceWeek} small>Advance to {cadenceLabel(league, (league.currentWeek||1)+1)} →</Btn>
          {Object.keys(weekScores).length > 0 && !league.weekStatus?.[selectedWeek]?.finalizedAt && (
            <Btn variant="ghost" onClick={() => {
              if (!confirm(`Finalize ${cadenceLabel(league, selectedWeek)}? This enables spoiler protection for all members.`)) return;
              const actorName = userProfile?.displayName || "Commissioner";
              let updated = appendAudit(league, {
                type: "finalize", actorName,
                desc: `${actorName} finalized ${cadenceLabel(league, selectedWeek)} (rosters auto-released)`,
                meta: { week: selectedWeek },
              });
              updated = {
                ...updated,
                weekStatus: {
                  ...(updated.weekStatus || {}),
                  [String(selectedWeek)]: { status: "finalized", finalizedAt: Date.now() }
                }
              };
              updated = ensureEpisode(updated, selectedWeek);
              onUpdate(updated);
            }} small>Finalize {cadenceLabel(league, selectedWeek)}</Btn>
          )}
          {league.weekStatus?.[selectedWeek]?.finalizedAt && (
            <Badge color="#4ecdc4">{cadenceLabel(league, selectedWeek)} Finalized</Badge>
          )}
        </div>
      ))}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WEEKLY DRAFT TAB (Standard format)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function WeeklyDraftTab({ league, onUpdate, standings }) {
  const [draftWeek, setDraftWeek] = useState(String(league.currentWeek||1));

  const config = league.standardConfig || { picksPerManager: 2, genderedDraft: false };
  const numTeams = (league.teams||[]).length;
  const totalPicks = numTeams * config.picksPerManager;

  // Cursor lives on the league object so it survives refresh and cross-device.
  // startedAt: stored for future audit/debug — not read by any current logic.
  const status = league.draftStatus?.[draftWeek] || { started: false, currentPick: 0, startedAt: null };
  const currentPick = status.currentPick;
  const draftStarted = status.started;

  const draftOrder = useMemo(() => {
    if (standings.length === 0) return (league.teams||[]).map(t=>t.id);
    return getInverseDraftOrder(standings);
  }, [standings, league.teams]);

  const draftedThisWeek = useMemo(() => {
    const ids = new Set();
    (league.teams||[]).forEach(t => { (t.weeklyRosters?.[draftWeek]||[]).forEach(id => ids.add(id)); });
    return ids;
  }, [league, draftWeek]);

  const activeContestants = (league.contestants||[]).filter(c => {
    if (c.status !== "eliminated") return true;
    if (c.eliminatedWeek && Number(draftWeek) <= c.eliminatedWeek) return true;
    return false;
  });
  const available = activeContestants.filter(c => !draftedThisWeek.has(c.id));

  function getCurrentTeamId() {
    if (numTeams === 0) return null;
    const round = Math.floor(currentPick / numTeams);
    const pos = currentPick % numTeams;
    const idx = round % 2 === 0 ? pos : numTeams - 1 - pos;
    return draftOrder[idx];
  }

  function startDraft() {
    const hasExistingPicks = (league.teams||[]).some(t => (t.weeklyRosters?.[draftWeek]||[]).length > 0);
    if (hasExistingPicks && !window.confirm("This week already has picks. Restart will clear all picks for this week. Continue?")) return;
    const updated = {
      ...league,
      teams: league.teams.map(t => ({
        ...t, weeklyRosters: { ...(t.weeklyRosters||{}), [draftWeek]: [] }
      })),
      draftStatus: {
        ...(league.draftStatus||{}),
        [draftWeek]: { started: true, currentPick: 0, startedAt: Date.now() },
      },
    };
    onUpdate(updated);
  }

  function makePick(contestantId) {
    const teamId = getCurrentTeamId();
    if (!teamId) return;
    const updated = {
      ...league,
      teams: league.teams.map(t =>
        t.id === teamId ? { ...t, weeklyRosters: { ...(t.weeklyRosters||{}), [draftWeek]: [...(t.weeklyRosters?.[draftWeek]||[]), contestantId] } } : t
      ),
      draftStatus: {
        ...(league.draftStatus||{}),
        [draftWeek]: { ...status, currentPick: status.currentPick + 1 },
      },
    };
    onUpdate(updated);
  }

  // Commissioner escape hatch — clears all picks + cursor for this week.
  // Reachable from in-progress and Done screens.
  function resetDraft() {
    if (!window.confirm(`Reset ${cadenceLabel(league, draftWeek)} draft? All picks will be cleared.`)) return;
    const updated = {
      ...league,
      teams: league.teams.map(t => ({
        ...t, weeklyRosters: { ...(t.weeklyRosters||{}), [draftWeek]: [] }
      })),
      draftStatus: {
        ...(league.draftStatus||{}),
        [draftWeek]: { started: false, currentPick: 0, startedAt: null },
      },
    };
    onUpdate(updated);
  }

  // Manual roster edit — Done-screen only. Bypasses snake order & gender quota.
  // draftStatus is intentionally untouched: currentPick stays at totalPicks so Done remains Done.
  function removeFromRoster(teamId, contestantId) {
    const updated = {
      ...league,
      teams: league.teams.map(t =>
        t.id === teamId ? { ...t, weeklyRosters: { ...(t.weeklyRosters||{}), [draftWeek]: (t.weeklyRosters?.[draftWeek]||[]).filter(id => id !== contestantId) } } : t
      ),
    };
    onUpdate(updated);
  }
  function addToRoster(teamId, contestantId) {
    if (!contestantId) return;
    const updated = {
      ...league,
      teams: league.teams.map(t =>
        t.id === teamId ? { ...t, weeklyRosters: { ...(t.weeklyRosters||{}), [draftWeek]: [...(t.weeklyRosters?.[draftWeek]||[]), contestantId] } } : t
      ),
    };
    onUpdate(updated);
  }

  const currentTeam = (league.teams||[]).find(t=>t.id===getCurrentTeamId());
  const round = numTeams > 0 ? Math.floor(currentPick / numTeams) + 1 : 0;
  const isDone = currentPick >= totalPicks;

  // Gendered draft filtering
  const currentTeamWeekRoster = currentTeam?.weeklyRosters?.[draftWeek] || [];
  const genderCounts = {};
  if (config.genderedDraft && currentTeam) {
    currentTeamWeekRoster.forEach(cid => {
      const c = (league.contestants||[]).find(x=>x.id===cid);
      if (c?.gender) genderCounts[c.gender] = (genderCounts[c.gender]||0) + 1;
    });
  }
  const filteredAvailable = config.genderedDraft
    ? available.filter(c => {
        const picksPerGender = config.picksPerManager / 2;
        if (c.gender && genderCounts[c.gender] >= picksPerGender) return false;
        return true;
      })
    : available;

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8 }}>
        <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>{cadenceWord(league)} Draft</h3>
        <Select value={draftWeek} onChange={e=>setDraftWeek(e.target.value)}
          options={Array.from({length:Math.max(league.currentWeek||1,1)+2},(_,i)=>({value:String(i+1),label:cadenceLabel(league, i+1)}))} />
      </div>

      {numTeams < 2 ? <EmptyState message="Need at least 2 teams to draft."/> :
       !draftStarted ? (
        <div>
          <div style={{ padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",marginBottom:16 }}>
            <div style={{ fontSize:13,fontWeight:700,color:"#e8e8f0",marginBottom:8 }}>{cadenceLabel(league, draftWeek)} Draft Setup</div>
            <div style={{ fontSize:12,color:"#8888aa",lineHeight:1.5 }}>
              {config.picksPerManager} picks/manager · Snake draft · {numTeams} teams · {totalPicks} total picks
              {config.genderedDraft && " · Gendered (equal per category)"}
            </div>
            <div style={{ fontSize:12,color:"#6a6a8a",marginTop:8 }}>Draft order (inverse of standings):</div>
            <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginTop:6 }}>
              {draftOrder.map((tid,i) => {
                const t = (league.teams||[]).find(x=>x.id===tid);
                return <span key={tid} style={{ padding:"3px 10px",borderRadius:6,fontSize:12,fontWeight:600,background:"#1e1e38",color:"#ccc" }}>{i+1}. {t?.name||"?"}</span>;
              })}
            </div>
          </div>
          <Btn onClick={startDraft} style={{ width:"100%",justifyContent:"center" }}><Icon name="grid" size={14}/> Start {cadenceLabel(league, draftWeek)} Draft</Btn>
        </div>
      ) : isDone ? (
        <div style={{ padding:24,background:"linear-gradient(135deg,rgba(78,205,196,0.08),rgba(233,69,96,0.08))",borderRadius:12,border:"1px solid #2a2a4a" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:36,marginBottom:8 }}>🎉</div>
            <div style={{ color:"#e8e8f0",fontWeight:700,fontSize:16,fontFamily:"'Anybody',sans-serif" }}>{cadenceLabel(league, draftWeek)} Draft Complete!</div>
            <div style={{ color:"#6a6a8a",fontSize:11,marginTop:4 }}>Tap × to remove or use the dropdown to add. Commissioner overrides bypass snake order and gender quotas.</div>
          </div>
          <div style={{ marginTop:16,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8 }}>
            {(league.teams||[]).map(t => {
              const roster = t.weeklyRosters?.[draftWeek] || [];
              return (
                <div key={t.id} style={{ padding:"10px 12px",background:"#1e1e38",borderRadius:8,fontSize:12,textAlign:"left" }}>
                  <div style={{ color:"#e8e8f0",fontWeight:700,marginBottom:6 }}>{t.name}</div>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:4,marginBottom:6 }}>
                    {roster.length === 0 && <span style={{ color:"#6a6a8a",fontSize:11,fontStyle:"italic" }}>empty</span>}
                    {roster.map(cid => {
                      const c = (league.contestants||[]).find(x=>x.id===cid);
                      if (!c) return null;
                      return (
                        <span key={cid} style={{ display:"inline-flex",alignItems:"center",gap:4,padding:"2px 4px 2px 8px",background:"#2a2a4a",borderRadius:6,fontSize:11,color:"#e8e8f0" }}>
                          {c.name}
                          <button onClick={()=>removeFromRoster(t.id, cid)} title="Remove" style={{ background:"transparent",border:"none",color:"#8888aa",cursor:"pointer",padding:"0 4px",fontSize:14,lineHeight:1 }}>×</button>
                        </span>
                      );
                    })}
                  </div>
                  <select value="" onChange={e=>{ const v=e.target.value; e.target.value=""; addToRoster(t.id, v); }} style={{ width:"100%",background:"#12121f",border:"1px solid #2a2a4a",borderRadius:6,color:"#e8e8f0",fontSize:11,padding:"5px 8px",fontFamily:"'Outfit',sans-serif",cursor:"pointer" }}>
                    <option value="">+ Add contestant…</option>
                    {available.map(c => <option key={c.id} value={c.id}>{c.name}{c.gender ? ` (${c.gender})` : ""}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
          <button onClick={resetDraft} style={{ marginTop:16,width:"100%",padding:"9px 14px",background:"transparent",border:"1px solid #2a2a4a",borderRadius:8,color:"#8888aa",fontSize:12,fontFamily:"'Outfit',sans-serif",cursor:"pointer",fontWeight:600 }}>
            Reset {cadenceLabel(league, draftWeek)} Draft
          </button>
        </div>
      ) : (
        <div>
          <div style={{ padding:"14px 16px",borderRadius:10,marginBottom:14,
            background:"linear-gradient(135deg,rgba(233,69,96,0.1),rgba(245,166,35,0.05))",border:"1px solid rgba(233,69,96,0.3)" }}>
            <div style={{ fontSize:12,color:"#f5a623",fontWeight:700,marginBottom:4 }}>ON THE CLOCK</div>
            <div style={{ fontSize:18,fontWeight:800,color:"#e8e8f0",fontFamily:"'Anybody',sans-serif" }}>{currentTeam?.name||"—"}</div>
            <div style={{ fontSize:12,color:"#6a6a8a",marginTop:2 }}>Round {round}, Pick {currentPick+1} of {totalPicks}</div>
            {config.genderedDraft && Object.keys(genderCounts).length > 0 && (
              <div style={{ fontSize:11,color:"#8888aa",marginTop:4 }}>Already picked: {Object.entries(genderCounts).map(([g,n])=>`${n} ${g}`).join(", ")}</div>
            )}
          </div>
          {filteredAvailable.length === 0 ? (
            <EmptyState message={
              (league.contestants||[]).length === 0
                ? "No contestants in the Cast yet. Add contestants on the Cast tab before drafting."
                : config.genderedDraft && available.length > 0
                ? `No eligible contestants for ${currentTeam?.name||"this team"} — gender quota reached. Check Cast or league settings.`
                : `No contestants available to draft this ${cadenceWord(league).toLowerCase()}.`
            }/>
          ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
            {filteredAvailable.map(c=>(
              <button key={c.id} onClick={()=>makePick(c.id)} style={{
                display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#12121f",
                border:"1px solid #1e1e38",borderRadius:8,cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif",transition:"all 0.1s ease",
              }} onMouseEnter={e=>{e.currentTarget.style.borderColor="#4ecdc4"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#1e1e38"}}>
                <ContestantAvatar contestant={c} league={league} size={30} />
                <div style={{ flex:1 }}>
                  <div style={{ color:"#e8e8f0",fontWeight:600,fontSize:13 }}>{c.name} {c.gender && <span style={{ color:"#6a6a8a",fontSize:10 }}>({c.gender})</span>}</div>
                  <div style={{ color:"#6a6a8a",fontSize:11 }}>{c.bio||"—"}</div>
                </div>
                <span style={{ color:"#4ecdc4",fontSize:12,fontWeight:600 }}>Draft →</span>
              </button>
            ))}
          </div>
          )}
          <button onClick={resetDraft} style={{ marginTop:14,width:"100%",padding:"9px 14px",background:"transparent",border:"1px solid #2a2a4a",borderRadius:8,color:"#8888aa",fontSize:12,fontFamily:"'Outfit',sans-serif",cursor:"pointer",fontWeight:600 }}>
            Reset {cadenceLabel(league, draftWeek)} Draft
          </button>
        </div>
      )}
    </div>
  );
}

// Finale-week couple picker — replaces the normal depth chart UI for one week
// when league.finaleWeek === league.currentWeek. Each manager picks a Hero
// couple (both members × 2) and a Sidekick couple (both members × 1.5). The
// saved chart shape is { mode: "couples", heroCouple: [id, id], sidekickCouple: [id, id] }
// which the scoring engine in src/scoring.js has a dedicated branch for.
function FinaleCouplePickerScreen({ league, onUpdate, lockedToTeamId, defaultTeamId, isCommissioner, myTeamId }) {
  const [selectedTeam, setSelectedTeam] = useState(lockedToTeamId || defaultTeamId || myTeamId || (league.teams||[])[0]?.id || "");
  const team = (league.teams||[]).find(t => t.id === selectedTeam);
  // Finale couple-pick targets the current week — the commissioner flips finaleActive
  // when the actual finale episode airs, and we write the pick to that week's chart.
  const finaleWeek = Number(league.currentWeek || 1);
  const couples = league.couples || [];
  const contestants = league.contestants || [];
  const byId = Object.fromEntries(contestants.map(c => [c.id, c]));

  const savedChart = team?.weeklyDepthCharts?.[String(finaleWeek)];
  const savedHero = savedChart?.mode === "couples" ? (savedChart.heroCouple || []) : [];
  const savedSidekick = savedChart?.mode === "couples" ? (savedChart.sidekickCouple || []) : [];
  const savedHeroId = couples.find(c => arraysEqualUnordered(c.members, savedHero))?.id || "";
  const savedSidekickId = couples.find(c => arraysEqualUnordered(c.members, savedSidekick))?.id || "";

  const [heroId, setHeroId] = useState(savedHeroId);
  const [sidekickId, setSidekickId] = useState(savedSidekickId);

  useEffect(() => { setHeroId(savedHeroId); setSidekickId(savedSidekickId); }, [selectedTeam, savedHeroId, savedSidekickId]);

  const dirty = heroId !== savedHeroId || sidekickId !== savedSidekickId;
  const canSave = !!heroId && !!sidekickId && heroId !== sidekickId && dirty;
  const readOnly = !!lockedToTeamId && lockedToTeamId !== myTeamId;

  function save() {
    if (!canSave || !team) return;
    const hero = couples.find(c => c.id === heroId);
    const side = couples.find(c => c.id === sidekickId);
    if (!hero || !side) return;
    const newChart = { mode: "couples", heroCouple: hero.members || [], sidekickCouple: side.members || [] };
    onUpdate({
      ...league,
      teams: league.teams.map(t => t.id === team.id ? {
        ...t,
        weeklyDepthCharts: { ...(t.weeklyDepthCharts||{}), [String(finaleWeek)]: newChart },
      } : t),
    });
  }

  function renderCoupleLabel(c) {
    if (!c) return "—";
    const [aId, bId] = c.members || [];
    const a = byId[aId]; const b = byId[bId];
    if (!a || !b) return "(missing member)";
    return `${a.name} ♥ ${b.name}`;
  }

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8 }}>
        <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>Finale Couple Pick</h3>
        <Badge color="#e94560">{cadenceWord(league)} {finaleWeek} · Final</Badge>
      </div>

      <div style={{ padding:"12px 14px",background:"#e9456011",borderRadius:10,border:"1px solid #e9456033",marginBottom:14,fontSize:12,color:"#e94560",lineHeight:1.5 }}>
        ♥ Finale week — pick a Hero couple (both members ×2) and a Sidekick couple (both members ×1.5). The depth chart is paused for this {cadenceWord(league).toLowerCase()} only.
      </div>

      {(league.teams||[]).length > 1 && !lockedToTeamId && (
        <Select label="Team" value={selectedTeam} onChange={e=>setSelectedTeam(e.target.value)} options={(league.teams||[]).map(t => ({ value: t.id, label: `${t.name} (${t.owner})` }))} />
      )}

      {!team && <EmptyState message="No team selected." />}
      {team && couples.length < 2 && (
        <EmptyState message={`Need at least 2 couples configured to pick. ${couples.length} couple${couples.length===1?"":"s"} set so far — add more on the Cast tab → Manage → Couples.`} />
      )}

      {team && couples.length >= 2 && (
        <>
          <div style={{ marginBottom:14,padding:"14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#f5a623",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em" }}>Hero Couple · ×2</div>
            {readOnly ? (
              <div style={{ fontSize:14,color:"#e8e8f0",fontWeight:600 }}>{renderCoupleLabel(couples.find(c => c.id === savedHeroId))}</div>
            ) : (
              <select value={heroId} onChange={e=>setHeroId(e.target.value)} style={{
                width:"100%",padding:"10px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
                color:heroId?"#e8e8f0":"#6a6a8a",fontSize:14,fontFamily:"'Outfit',sans-serif",outline:"none",
              }}>
                <option value="">— Pick a couple —</option>
                {couples.filter(c => c.id !== sidekickId).map(c => (
                  <option key={c.id} value={c.id}>{renderCoupleLabel(c)}</option>
                ))}
              </select>
            )}
          </div>

          <div style={{ marginBottom:14,padding:"14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#4ecdc4",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em" }}>Sidekick Couple · ×1.5</div>
            {readOnly ? (
              <div style={{ fontSize:14,color:"#e8e8f0",fontWeight:600 }}>{renderCoupleLabel(couples.find(c => c.id === savedSidekickId))}</div>
            ) : (
              <select value={sidekickId} onChange={e=>setSidekickId(e.target.value)} style={{
                width:"100%",padding:"10px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
                color:sidekickId?"#e8e8f0":"#6a6a8a",fontSize:14,fontFamily:"'Outfit',sans-serif",outline:"none",
              }}>
                <option value="">— Pick a couple —</option>
                {couples.filter(c => c.id !== heroId).map(c => (
                  <option key={c.id} value={c.id}>{renderCoupleLabel(c)}</option>
                ))}
              </select>
            )}
          </div>

          {!readOnly && (
            <div style={{ display:"flex",gap:8,justifyContent:"flex-end" }}>
              {dirty && (
                <Btn variant="ghost" onClick={()=>{ setHeroId(savedHeroId); setSidekickId(savedSidekickId); }}>Discard</Btn>
              )}
              <Btn onClick={save} disabled={!canSave}>{savedChart?.mode === "couples" ? "Update Pick" : "Save Pick"}</Btn>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function arraysEqualUnordered(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const sa = [...a].sort(); const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEPTH CHART TAB (Captains format)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// League-wide polls — commissioner posts a poll with 1–10 questions organized
// into one or more groups. Each group can independently enable the "unique
// picks" rule (each manager must pick a different contestant for each
// question in that group). Each question can independently restrict its
// picker pool to Male / Female / All. Managers stage picks locally and
// commit with Submit; picks lock after submit (only the commissioner can
// clear a team's picks).
//
// Combined-gender Snog Marry Pie in one poll: two sections — "Boys SMP"
// with 3 Male-filtered questions + Unique on, "Girls SMP" with 3 Female-
// filtered questions + Unique on.
//
// Stored at league.polls = [{
//   id, name, createdAt, closed?,
//   groups: [{ id, name?, uniqueWithin?, questions: [{ id, text, genderFilter? }] }],
//   picks: { [teamId]: { [questionId]: contestantId } },
//   // Legacy fields preserved on old polls (read via effectiveGroups):
//   uniquePerPoll?, genderFilter?, questions?, question?
// }]
const MAX_QUESTIONS_PER_POLL = 10;
function effectiveQuestionGender(poll, q) {
  return q?.genderFilter || poll?.genderFilter || "";
}
// Normalizes any poll shape into the groups model so display code can iterate
// uniformly. Old flat-questions polls collapse into a single default group.
function effectiveGroups(poll) {
  if (poll?.groups && Array.isArray(poll.groups)) return poll.groups;
  const flatQs = poll?.questions || (poll?.question ? [{ id: "q1", text: poll.question }] : []);
  if (flatQs.length === 0) return [];
  return [{
    id: "default",
    name: "",
    uniqueWithin: !!poll?.uniquePerPoll,
    questions: flatQs,
  }];
}
function flattenGroupQuestions(groups) {
  return groups.flatMap(g => g.questions || []);
}

function PollsSection({ league, team, onUpdate, isCommissioner }) {
  const polls = league.polls || [];
  const contestants = league.contestants || [];
  const byId = Object.fromEntries(contestants.map(c => [c.id, c]));
  const activeContestants = contestants.filter(c => c.status !== "eliminated");

  const [draftName, setDraftName] = useState("");
  const [draftGroups, setDraftGroups] = useState([
    { name: "", uniqueWithin: false, questions: [{ text: "", genderFilter: "" }] },
  ]);
  const [drafts, setDrafts] = useState({});
  // v2.4.44.0: collapse the create-poll builder behind an Add button so the
  // Polls section reads as the list of existing polls by default — testers
  // landing on Standings were greeted by a wall of empty form fields.
  const [showCreate, setShowCreate] = useState(false);

  const totalDraftQuestions = draftGroups.reduce((s, g) => s + g.questions.length, 0);

  function addQuestion(gIdx) {
    if (totalDraftQuestions >= MAX_QUESTIONS_PER_POLL) return;
    setDraftGroups(prev => prev.map((g, i) => i === gIdx ? { ...g, questions: [...g.questions, { text:"", genderFilter:"" }] } : g));
  }
  function removeQuestion(gIdx, qIdx) {
    setDraftGroups(prev => {
      const next = prev.map((g, i) => i === gIdx ? { ...g, questions: g.questions.filter((_, j) => j !== qIdx) } : g);
      const cleaned = next.filter(g => g.questions.length > 0);
      return cleaned.length > 0 ? cleaned : [{ name:"", uniqueWithin:false, questions:[{ text:"", genderFilter:"" }] }];
    });
  }
  function updateQuestionText(gIdx, qIdx, text) {
    setDraftGroups(prev => prev.map((g, i) => i === gIdx ? { ...g, questions: g.questions.map((q, j) => j === qIdx ? { ...q, text } : q) } : g));
  }
  function updateQuestionGender(gIdx, qIdx, genderFilter) {
    setDraftGroups(prev => prev.map((g, i) => i === gIdx ? { ...g, questions: g.questions.map((q, j) => j === qIdx ? { ...q, genderFilter } : q) } : g));
  }
  function updateGroupName(gIdx, name) {
    setDraftGroups(prev => prev.map((g, i) => i === gIdx ? { ...g, name } : g));
  }
  function updateGroupUnique(gIdx, uniqueWithin) {
    setDraftGroups(prev => prev.map((g, i) => i === gIdx ? { ...g, uniqueWithin } : g));
  }
  function addGroup() {
    if (totalDraftQuestions >= MAX_QUESTIONS_PER_POLL) return;
    setDraftGroups(prev => [...prev, { name:"", uniqueWithin:false, questions:[{ text:"", genderFilter:"" }] }]);
  }
  function removeGroup(gIdx) {
    if (draftGroups.length <= 1) return;
    setDraftGroups(prev => prev.filter((_, i) => i !== gIdx));
  }

  function createPoll() {
    const name = draftName.trim();
    const cleanGroups = draftGroups
      .map(g => ({
        ...g,
        questions: g.questions
          .map(q => ({ text: q.text.trim(), genderFilter: q.genderFilter || "" }))
          .filter(q => q.text),
      }))
      .filter(g => g.questions.length > 0);
    if (!name || cleanGroups.length === 0) return;
    const poll = {
      id: generateId(),
      name,
      createdAt: Date.now(),
      groups: cleanGroups.map(g => ({
        id: generateId(),
        name: g.name?.trim() || "",
        ...(g.uniqueWithin ? { uniqueWithin: true } : {}),
        questions: g.questions.map(q => ({
          id: generateId(),
          text: q.text,
          ...(q.genderFilter ? { genderFilter: q.genderFilter } : {}),
        })),
      })),
      picks: {},
    };
    onUpdate({ ...league, polls: [poll, ...polls] });
    setDraftName("");
    setDraftGroups([{ name:"", uniqueWithin:false, questions:[{ text:"", genderFilter:"" }] }]);
  }
  function deletePoll(pollId) {
    if (!confirm("Delete this poll? All picks will be lost.")) return;
    onUpdate({ ...league, polls: polls.filter(p => p.id !== pollId) });
  }
  function togglePollClosed(pollId) {
    onUpdate({ ...league, polls: polls.map(p => p.id === pollId ? { ...p, closed: !p.closed } : p) });
  }
  function setDraftPick(pollId, questionId, contestantId) {
    setDrafts(prev => ({
      ...prev,
      [pollId]: { ...(prev[pollId] || {}), [questionId]: contestantId },
    }));
  }
  function submitPoll(pollId) {
    const poll = polls.find(p => p.id === pollId);
    const draft = drafts[pollId];
    if (!poll || !team || !draft) return;
    const groups = effectiveGroups(poll);
    const allQuestions = flattenGroupQuestions(groups);
    if (!allQuestions.every(q => draft[q.id])) return;
    for (const g of groups) {
      if (!g.uniqueWithin) continue;
      const picked = g.questions.map(q => draft[q.id]).filter(Boolean);
      if (new Set(picked).size !== picked.length) return;
    }
    const teamPicks = {};
    allQuestions.forEach(q => { teamPicks[q.id] = draft[q.id]; });
    onUpdate({ ...league, polls: polls.map(p => p.id === pollId ? {
      ...p, picks: { ...(p.picks||{}), [team.id]: teamPicks },
    } : p) });
    setDrafts(prev => { const next = {...prev}; delete next[pollId]; return next; });
  }
  function clearTeamPicks(pollId, targetTeamId) {
    const t = (league.teams||[]).find(x => x.id === targetTeamId);
    if (!confirm(`Clear ${t?.name || "this team"}'s picks for this poll? They'll be able to submit again.`)) return;
    onUpdate({ ...league, polls: polls.map(p => {
      if (p.id !== pollId) return p;
      const newPicks = { ...(p.picks||{}) };
      delete newPicks[targetTeamId];
      return { ...p, picks: newPicks };
    }) });
  }

  // Auto-close the builder when a poll posts successfully — createPoll resets
  // draftName, so detecting "we just submitted" via draftName flip is the
  // simplest signal without rewiring createPoll's call sites.
  function handleCreatePoll() {
    const hadName = !!draftName.trim();
    createPoll();
    if (hadName) setShowCreate(false);
  }
  function cancelCreate() {
    setDraftName("");
    setDraftGroups([{ name:"", uniqueWithin:false, questions:[{ text:"", genderFilter:"" }] }]);
    setShowCreate(false);
  }

  return (
    <div>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:12 }}>
        <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>Polls</h3>
        {isCommissioner && !showCreate && (
          <Btn small onClick={()=>setShowCreate(true)}>+ Add</Btn>
        )}
      </div>
      {isCommissioner && showCreate && (
        <div style={{ marginBottom:16,padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#6a6a8a",textTransform:"uppercase",letterSpacing:"0.05em" }}>Create a Poll</div>
            <button onClick={cancelCreate} title="Cancel" style={{ background:"none",border:"1px solid #2a2a4a",borderRadius:6,color:"#8888aa",fontSize:10,cursor:"pointer",padding:"3px 8px",fontFamily:"'Outfit',sans-serif" }}>× Close</button>
          </div>
          <input value={draftName} onChange={e=>setDraftName(e.target.value)} placeholder="Poll name (e.g. Snog Marry Pie)"
            style={{ width:"100%",padding:"8px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
              color:"#e8e8f0",fontSize:13,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box",marginBottom:10 }} />
          <div style={{ fontSize:10,fontWeight:600,color:"#6a6a8a",textTransform:"uppercase",letterSpacing:"0.04em",marginBottom:5 }}>
            Questions ({totalDraftQuestions}/{MAX_QUESTIONS_PER_POLL})
          </div>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {draftGroups.map((g, gIdx) => {
              const isMultiGroup = draftGroups.length > 1;
              return (
                <div key={gIdx} style={{ padding:isMultiGroup?"10px 12px":0, background:isMultiGroup?"#0d0d18":"transparent", borderRadius:isMultiGroup?8:0, border:isMultiGroup?"1px solid #1e1e38":"none" }}>
                  {isMultiGroup && (
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:6,marginBottom:8 }}>
                      <input value={g.name} onChange={e=>updateGroupName(gIdx, e.target.value)} placeholder={`Section ${gIdx+1} name (optional)`}
                        style={{ flex:1,padding:"5px 8px",background:"#12121f",border:"1px solid #2a2a4a",borderRadius:5,
                          color:"#e8e8f0",fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none",minWidth:0 }} />
                      <button onClick={()=>removeGroup(gIdx)} title="Remove this section" style={{ background:"none",border:"1px solid #2a2a4a",borderRadius:6,color:"#e94560",fontSize:10,cursor:"pointer",padding:"4px 8px",fontFamily:"'Outfit',sans-serif",flexShrink:0 }}>× Section</button>
                    </div>
                  )}
                  <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                    {g.questions.map((q, qIdx) => (
                      <div key={qIdx} style={{ display:"flex",gap:4,alignItems:"center" }}>
                        <span style={{ fontSize:10,color:"#4a4a6a",width:18,textAlign:"right",flexShrink:0 }}>{qIdx+1}.</span>
                        <input value={q.text} onChange={e=>updateQuestionText(gIdx, qIdx, e.target.value)} placeholder={qIdx === 0 ? (isMultiGroup ? "First question in this section" : "e.g. Who's the most attractive?") : "Question text"}
                          style={{ flex:1,padding:"6px 10px",background:isMultiGroup?"#12121f":"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
                            color:"#e8e8f0",fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none",minWidth:0 }} />
                        <select value={q.genderFilter || ""} onChange={e=>updateQuestionGender(gIdx, qIdx, e.target.value)} title="Restrict picker pool for this question"
                          style={{ width:54,padding:"6px 4px",background:isMultiGroup?"#12121f":"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
                            color:q.genderFilter?(q.genderFilter==="Male"?"#4d8aff":"#ff5da0"):"#6a6a8a",fontSize:11,fontFamily:"'Outfit',sans-serif",outline:"none",flexShrink:0,textAlign:"center" }}>
                          <option value="">All</option>
                          <option value="Male">♂ M</option>
                          <option value="Female">♀ F</option>
                        </select>
                        {(g.questions.length > 1 || draftGroups.length > 1) && (
                          <button onClick={()=>removeQuestion(gIdx, qIdx)} title="Remove question" style={{ background:"none",border:"1px solid #2a2a4a",borderRadius:6,color:"#e94560",width:26,height:26,cursor:"pointer",fontSize:13,flexShrink:0 }}>×</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:6,marginTop:8,flexWrap:"wrap" }}>
                    <label style={{ display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:11,color:"#aaaabf" }}>
                      <input type="checkbox" checked={!!g.uniqueWithin} onChange={e=>updateGroupUnique(gIdx, e.target.checked)} style={{ accentColor:"#e94560",width:13,height:13,flexShrink:0 }} />
                      <span>Unique picks {isMultiGroup ? "within this section" : "across all questions"}</span>
                    </label>
                    <Btn small variant="ghost" onClick={()=>addQuestion(gIdx)} disabled={totalDraftQuestions >= MAX_QUESTIONS_PER_POLL}>+ Question</Btn>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,gap:6,flexWrap:"wrap" }}>
            <Btn small variant="ghost" onClick={addGroup} disabled={totalDraftQuestions >= MAX_QUESTIONS_PER_POLL}>+ Add Section</Btn>
            <Btn small onClick={handleCreatePoll} disabled={!draftName.trim() || totalDraftQuestions === 0 || !draftGroups.some(g => g.questions.some(q => q.text.trim()))}>Post Poll</Btn>
          </div>
          <div style={{ fontSize:10,color:"#6a6a8a",marginTop:8,fontStyle:"italic",lineHeight:1.4 }}>
            Each section's "Unique picks" rule applies to questions in that section only. Use sections when different groups of questions need different rules — e.g. SMP covering Boys + Girls (Boys section with Unique on, Girls section with Unique on).
          </div>
        </div>
      )}

      {polls.length === 0 ? (
        <EmptyState message={isCommissioner ? "No polls yet. Tap + Add to create one." : "Waiting for the commissioner to post a poll."} />
      ) : polls.map(poll => {
        const groups = effectiveGroups(poll);
        const allQuestions = flattenGroupQuestions(groups);
        const allPicks = poll.picks || {};
        const teamsSubmitted = Object.keys(allPicks);
        const totalTeams = (league.teams||[]).length;
        const submitted = team ? !!allPicks[team.id] : false;
        const draft = drafts[poll.id] || {};
        const poolForQuestion = (q) => {
          const gf = effectiveQuestionGender(poll, q);
          return activeContestants.filter(c => !gf || c.gender === gf);
        };
        const allAnswered = allQuestions.every(q => draft[q.id]);
        const failingGroupIdx = groups.findIndex(g => {
          if (!g.uniqueWithin) return false;
          const picked = g.questions.map(q => draft[q.id]).filter(Boolean);
          return new Set(picked).size !== picked.length;
        });
        const uniqueOk = failingGroupIdx === -1;
        const canSubmit = !submitted && !poll.closed && team && allAnswered && uniqueOk;
        const hasMultipleGroups = groups.length > 1;

        return (
          <div key={poll.id} style={{ marginBottom:14,padding:"14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",opacity:poll.closed?0.7:1 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,marginBottom:10 }}>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:15,fontWeight:800,fontFamily:"'Anybody',sans-serif",color:"#e8e8f0",lineHeight:1.2,letterSpacing:"-0.01em",wordBreak:"break-word" }}>{poll.name || "(untitled)"}</div>
                <div style={{ fontSize:10,color:"#6a6a8a",marginTop:3 }}>
                  {allQuestions.length} question{allQuestions.length===1?"":"s"}{hasMultipleGroups?` · ${groups.length} sections`:""} · {teamsSubmitted.length} of {totalTeams} submitted{poll.closed?" · CLOSED":""}
                </div>
              </div>
              {isCommissioner && (
                <div style={{ display:"flex",gap:4,flexShrink:0 }}>
                  <button onClick={()=>togglePollClosed(poll.id)} title={poll.closed?"Reopen poll":"Close poll"} style={{ background:"none",border:"1px solid #2a2a4a",borderRadius:6,color:"#8888aa",fontSize:10,cursor:"pointer",padding:"4px 8px",fontFamily:"'Outfit',sans-serif" }}>{poll.closed?"Reopen":"Close"}</button>
                  <button onClick={()=>deletePoll(poll.id)} title="Delete poll" style={{ background:"none",border:"1px solid #2a2a4a",borderRadius:6,color:"#e94560",fontSize:10,cursor:"pointer",padding:"4px 8px",fontFamily:"'Outfit',sans-serif" }}>Delete</button>
                </div>
              )}
            </div>

            {team && (submitted ? (
              <div style={{ marginBottom:12,padding:"10px 12px",background:"#0d0d18",borderRadius:8,border:"1px solid #4ecdc433" }}>
                <div style={{ fontSize:10,fontWeight:700,color:"#4ecdc4",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:6 }}>✓ Your picks (locked)</div>
                {groups.map((g, gIdx) => (
                  <div key={g.id || gIdx} style={{ marginTop:gIdx>0?10:0 }}>
                    {hasMultipleGroups && (
                      <div style={{ fontSize:10,fontWeight:700,color:"#8888aa",letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:4 }}>{g.name || `Section ${gIdx+1}`}</div>
                    )}
                    <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                      {g.questions.map((q, qIdx) => {
                        const qGender = effectiveQuestionGender(poll, q);
                        return (
                          <div key={q.id} style={{ display:"flex",alignItems:"center",gap:8,fontSize:12 }}>
                            <span style={{ color:"#6a6a8a",fontWeight:700,minWidth:24 }}>Q{qIdx+1}</span>
                            {qGender && <span style={{ fontSize:8,fontWeight:700,padding:"1px 5px",borderRadius:99,background:qGender==="Male"?"#4d8aff22":"#ff5da022",color:qGender==="Male"?"#4d8aff":"#ff5da0",letterSpacing:"0.04em",textTransform:"uppercase",flexShrink:0 }}>{qGender[0]}</span>}
                            <span style={{ color:"#8888aa",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{q.text}</span>
                            <span style={{ color:"#e8e8f0",fontWeight:600,flexShrink:0 }}>{byId[allPicks[team.id]?.[q.id]]?.name || "—"}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : !poll.closed && (
              <div style={{ marginBottom:12,padding:"10px 12px",background:"#0d0d18",borderRadius:8,border:"1px solid #1e1e38" }}>
                <div style={{ fontSize:10,fontWeight:700,color:"#6a6a8a",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:6 }}>Your picks (not yet submitted)</div>
                {groups.map((g, gIdx) => (
                  <div key={g.id || gIdx} style={{ marginTop:gIdx>0?12:0 }}>
                    {hasMultipleGroups && (
                      <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:6 }}>
                        <span style={{ fontSize:10,fontWeight:700,color:"#aaaabf",letterSpacing:"0.04em",textTransform:"uppercase" }}>{g.name || `Section ${gIdx+1}`}</span>
                        {g.uniqueWithin && <span style={{ fontSize:8,fontWeight:700,padding:"1px 6px",borderRadius:99,background:"#4ecdc418",color:"#4ecdc4",letterSpacing:"0.04em",textTransform:"uppercase",flexShrink:0 }}>Unique</span>}
                      </div>
                    )}
                    <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                      {g.questions.map((q, qIdx) => {
                        const myDraft = draft[q.id] || "";
                        const qGender = effectiveQuestionGender(poll, q);
                        const sameGroupDrafted = g.uniqueWithin
                          ? new Set(g.questions.filter(other => other.id !== q.id).map(other => draft[other.id]).filter(Boolean))
                          : null;
                        const options = poolForQuestion(q).filter(c => !sameGroupDrafted || !sameGroupDrafted.has(c.id));
                        return (
                          <div key={q.id}>
                            <div style={{ display:"flex",gap:6,alignItems:"flex-start",marginBottom:4,flexWrap:"wrap" }}>
                              <span style={{ fontSize:10,fontWeight:700,color:"#f5a623",flexShrink:0,marginTop:2 }}>Q{qIdx+1}</span>
                              <div style={{ flex:1,fontSize:12,color:"#e8e8f0",lineHeight:1.4,wordBreak:"break-word",minWidth:0 }}>{q.text}</div>
                              {qGender && <span style={{ fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:99,background:qGender==="Male"?"#4d8aff22":"#ff5da022",color:qGender==="Male"?"#4d8aff":"#ff5da0",letterSpacing:"0.04em",textTransform:"uppercase",flexShrink:0,marginTop:2 }}>{qGender}</span>}
                            </div>
                            <select value={myDraft} onChange={e=>setDraftPick(poll.id, q.id, e.target.value)} style={{
                              width:"100%",padding:"7px 10px",background:"#12121f",border:"1px solid #2a2a4a",borderRadius:6,
                              color:myDraft?"#e8e8f0":"#6a6a8a",fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box",
                            }}>
                              <option value="">— pick —</option>
                              {options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,gap:6,flexWrap:"wrap" }}>
                  <div style={{ fontSize:10,color:allAnswered && uniqueOk ? "#4ecdc4" : "#6a6a8a",fontStyle:"italic" }}>
                    {!allAnswered ? `Answer all ${allQuestions.length} question${allQuestions.length===1?"":"s"} to submit.` :
                     !uniqueOk ? `Pick different contestants within ${groups[failingGroupIdx]?.name || `Section ${failingGroupIdx+1}`}.` :
                     "Ready to submit — picks lock after submit."}
                  </div>
                  <Btn small onClick={()=>submitPoll(poll.id)} disabled={!canSubmit}>Submit My Picks</Btn>
                </div>
              </div>
            ))}

            {groups.map((g, gIdx) => (
              <div key={g.id || gIdx} style={{ marginTop:gIdx>0?14:0 }}>
                {hasMultipleGroups && (
                  <div style={{ display:"flex",alignItems:"center",gap:6,marginBottom:8,paddingBottom:6,borderBottom:"1px solid #1e1e38" }}>
                    <span style={{ fontSize:11,fontWeight:800,fontFamily:"'Anybody',sans-serif",color:"#e8e8f0",letterSpacing:"-0.01em" }}>{g.name || `Section ${gIdx+1}`}</span>
                    {g.uniqueWithin && <span style={{ fontSize:8,fontWeight:700,padding:"1px 6px",borderRadius:99,background:"#4ecdc418",color:"#4ecdc4",letterSpacing:"0.04em",textTransform:"uppercase" }}>Unique</span>}
                  </div>
                )}
                <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
                  {g.questions.map((q, qIdx) => {
                    // v2.6.4.0: consolidated results — one row per picked
                    // contestant showing rank/count/% bar AND the team-name
                    // chips of who picked them. Same info as the old separate
                    // "Picks" + "Tally" sections, but tied together so you
                    // never have to mentally cross-reference.
                    const pickersFor = {}; // contestantId → [teamName, ...]
                    Object.entries(allPicks).forEach(([tid, tp]) => {
                      const cid = tp?.[q.id];
                      if (!cid) return;
                      if (!pickersFor[cid]) pickersFor[cid] = [];
                      const tName = (league.teams||[]).find(t => t.id === tid)?.name || tid;
                      pickersFor[cid].push(tName);
                    });
                    const tallyEntries = Object.entries(pickersFor)
                      .map(([id, pickers]) => ({ id, count: pickers.length, pickers }))
                      .sort((a,b) => b.count - a.count);
                    const totalPicks = tallyEntries.reduce((s, e) => s + e.count, 0);
                    const maxCount = tallyEntries[0]?.count || 1;
                    const qGender = effectiveQuestionGender(poll, q);
                    return (
                      <div key={q.id} style={{ paddingTop:qIdx>0?12:0,borderTop:qIdx>0?"1px solid #1e1e38":"none" }}>
                        <div style={{ display:"flex",gap:6,alignItems:"flex-start",marginBottom:8,flexWrap:"wrap" }}>
                          <span style={{ fontSize:10,fontWeight:700,color:"#f5a623",letterSpacing:"0.04em",flexShrink:0,marginTop:2 }}>Q{qIdx+1}</span>
                          <div style={{ flex:1,fontSize:12,fontWeight:600,color:"#aaaabf",lineHeight:1.4,wordBreak:"break-word",minWidth:0 }}>{q.text}</div>
                          {qGender && <span style={{ fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:99,background:qGender==="Male"?"#4d8aff22":"#ff5da022",color:qGender==="Male"?"#4d8aff":"#ff5da0",letterSpacing:"0.04em",textTransform:"uppercase",flexShrink:0,marginTop:2 }}>{qGender}</span>}
                          {totalPicks > 0 && <span style={{ fontSize:10,color:"#6a6a8a",fontWeight:600,flexShrink:0,marginTop:2 }}>{totalPicks} pick{totalPicks!==1?"s":""}</span>}
                        </div>
                        {tallyEntries.length === 0 ? (
                          <div style={{ fontSize:11,color:"#4a4a6a",fontStyle:"italic",padding:"6px 0" }}>No picks yet.</div>
                        ) : (
                          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                            {tallyEntries.map(e => {
                              const pct = totalPicks > 0 ? Math.round((e.count / totalPicks) * 100) : 0;
                              const barPct = Math.max(8, Math.round((e.count / maxCount) * 100));
                              return (
                                <div key={e.id} style={{ padding:"6px 8px",background:"#0d0d18",borderRadius:6,border:"1px solid #1a1a30" }}>
                                  <div style={{ position:"relative",height:24,display:"flex",alignItems:"center",gap:8 }}>
                                    <div style={{ position:"absolute",inset:0,borderRadius:4,background:"#1a1a30",overflow:"hidden" }}>
                                      <div style={{ width:`${barPct}%`,height:"100%",background:"linear-gradient(90deg,#f5a62333,#f5a62311)",transition:"width 0.3s ease" }}/>
                                    </div>
                                    <span style={{ position:"relative",flex:1,minWidth:0,fontSize:12,fontWeight:700,color:"#e8e8f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",paddingLeft:6 }}>{byId[e.id]?.name || "—"}</span>
                                    <span style={{ position:"relative",fontSize:11,color:"#f5a623",fontWeight:700,paddingRight:6,flexShrink:0 }}>{e.count} &middot; {pct}%</span>
                                  </div>
                                  <div style={{ display:"flex",flexWrap:"wrap",gap:3,marginTop:5 }}>
                                    {e.pickers.map((tn, i) => (
                                      <span key={i} style={{ fontSize:10,padding:"2px 7px",borderRadius:99,background:"#12121f",border:"1px solid #2a2a4a",color:"#8888aa",fontFamily:"'Outfit',sans-serif" }}>{tn}</span>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {isCommissioner && teamsSubmitted.length > 0 && (
              <div style={{ marginTop:12,paddingTop:10,borderTop:"1px solid #1e1e38" }}>
                <div style={{ fontSize:9,fontWeight:700,color:"#6a6a8a",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:5 }}>Commissioner — clear a team's picks</div>
                <div style={{ display:"flex",gap:4,flexWrap:"wrap" }}>
                  {teamsSubmitted.map(tid => {
                    const t = (league.teams||[]).find(x => x.id === tid);
                    if (!t) return null;
                    return (
                      <button key={tid} onClick={()=>clearTeamPicks(poll.id, tid)} title={`Clear ${t.name}'s picks`} style={{
                        background:"none",border:"1px solid #2a2a4a",borderRadius:6,color:"#e94560",fontSize:10,cursor:"pointer",padding:"4px 8px",fontFamily:"'Outfit',sans-serif",
                      }}>× {t.name}</button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DepthChartTab({ league, onUpdate, lockedToTeamId, defaultTeamId, isCommissioner, spoilerActive, myTeamId, userProfile }) {
  // Finale-week swap: when the commissioner has flipped on finale mode, render
  // the couple picker instead of the depth chart for the current week. Early-return
  // BEFORE any hooks so React doesn't see a different hook order across renders —
  // the picker declares its own hooks inside its own component body. See
  // FinaleCouplePickerScreen. Commissioner flips finaleActive off after the finale
  // to return everyone to a normal depth chart on the following week.
  if (league.finaleActive) {
    return <FinaleCouplePickerScreen
      league={league}
      onUpdate={onUpdate}
      lockedToTeamId={lockedToTeamId}
      defaultTeamId={defaultTeamId}
      isCommissioner={isCommissioner}
      myTeamId={myTeamId}
    />;
  }
  const [selectedTeam, setSelectedTeam] = useState(lockedToTeamId || defaultTeamId || (league.teams||[])[0]?.id || "");
  const [localChart, setLocalChart] = useState({});
  const [editingName, setEditingName] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [showCustomize, setShowCustomize] = useState(false);
  const [customColor, setCustomColor] = useState("");
  const [customAvatar, setCustomAvatar] = useState("");
  const [customName, setCustomName] = useState("");
  // Pill bar inside My Roster — two views: the depth chart editor (the
  // primary UI) and Team History (per-week breakdown of past depth charts).
  // Polls used to live here too but moved to the Standings tab in v2.4.42.0
  // so they're visible to all managers without spelunking. The pill bar
  // sits below the team selector so switching modes preserves the team.
  const [myRosterMode, setMyRosterMode] = useState("depth");
  const [editingWeek, setEditingWeek] = useState(null); // null = current week, number = past week

  const team = (league.teams||[]).find(t=>t.id===selectedTeam);
  const regularSlots = league.captainsConfig?.regularSlots || 3;
  const currentWeek = league.currentWeek || 1;
  const effectiveWeek = editingWeek || currentWeek;
  const teamLocked = team ? isTeamLockedIn(league, team) : false;
  const lockedPoolSet = useMemo(
    () => (teamLocked && team?.lockedRoster ? new Set(team.lockedRoster) : null),
    [teamLocked, team]
  );
  const activeContestants = (league.contestants||[]).filter(c => {
    // When this team is locked in, the selectable pool is restricted to the
    // locked roster — eliminated members stay (ghost slot behavior).
    if (lockedPoolSet) return lockedPoolSet.has(c.id);
    if (c.status !== "eliminated") return true;
    if (c.eliminatedWeek && effectiveWeek <= c.eliminatedWeek) return true;
    return false;
  });
  const weeks = Object.keys(league.weeklyScores || {}).sort((a,b)=>+a - +b);

  const savedChart = editingWeek
    ? (team?.weeklyDepthCharts?.[String(editingWeek)] || team?.depthChart || { captain: null, coCaptain: null, regulars: [] })
    : (team?.depthChart || { captain: null, coCaptain: null, regulars: [] });
  const hasChanges = useMemo(() => {
    if (!team) return false;
    if (localChart.captain !== savedChart.captain) return true;
    if (localChart.coCaptain !== savedChart.coCaptain) return true;
    const lr = localChart.regulars || [];
    const sr = savedChart.regulars || [];
    if (lr.length !== sr.length) return true;
    return lr.some((id, i) => id !== sr[i]);
  }, [localChart, savedChart, team]);

  // Contestant season rankings
  const contestantRankings = useMemo(() => {
    const ranked = (league.contestants||[]).map(c => {
      const total = weeks.reduce((s,w) => s + calcContestantWeekPoints(league.weeklyScores?.[w]||{}, c.id), 0);
      return { id: c.id, total: Math.round(total*100)/100 };
    }).sort((a,b) => b.total - a.total);
    const map = {};
    ranked.forEach((c,i) => { map[c.id] = { rank: i+1, total: c.total }; });
    return map;
  }, [league, weeks]);

  // Last week's chart for swap detection
  const lastWeekChart = useMemo(() => {
    if (!team || currentWeek <= 1) return null;
    return team.weeklyDepthCharts?.[String(currentWeek - 1)] || null;
  }, [team, currentWeek]);

  const lastWeekRosterIds = useMemo(() => {
    if (!lastWeekChart) return new Set();
    const ids = new Set();
    if (lastWeekChart.captain) ids.add(lastWeekChart.captain);
    if (lastWeekChart.coCaptain) ids.add(lastWeekChart.coCaptain);
    (lastWeekChart.regulars||[]).forEach(id => ids.add(id));
    return ids;
  }, [lastWeekChart]);

  const currentRosterIds = useMemo(() => {
    const ids = new Set();
    if (localChart.captain) ids.add(localChart.captain);
    if (localChart.coCaptain) ids.add(localChart.coCaptain);
    (localChart.regulars||[]).forEach(id => ids.add(id));
    return ids;
  }, [localChart]);

  const swapsMade = useMemo(() => {
    if (!lastWeekChart || lastWeekRosterIds.size === 0) return 0;
    let count = 0;
    currentRosterIds.forEach(id => { if (!lastWeekRosterIds.has(id)) count++; });
    return count;
  }, [currentRosterIds, lastWeekRosterIds, lastWeekChart]);

  // Roster category constraint — generalized in v2.4.50.0. The captains config
  // can require N of each value of a category (gender or tribe). See
  // getRosterMinimums() which normalizes the old gender-only schema into the
  // new shape. Returns null when no constraint is active.
  const rosterMinimums = getRosterMinimums(league);
  const constraintActive = !!rosterMinimums;
  const rosterCounts = useMemo(() => {
    if (!rosterMinimums) return {};
    const allIds = [localChart.captain, localChart.coCaptain, ...(localChart.regulars||[])].filter(Boolean);
    return countRosterByCategory(allIds, league, rosterMinimums.category);
  }, [localChart, league, rosterMinimums]);
  const genderConstraintMet = !constraintActive || Object.entries(rosterMinimums.minimums).every(
    ([val, need]) => (rosterCounts[val] || 0) >= (Number(need) || 0)
  );
  // Kept the name `genderChipLabel` for back-compat with downstream JSX even
  // though it now describes whatever category is active.
  const genderChipLabel = (() => {
    if (!constraintActive) return null;
    const shortVal = (v) => rosterMinimums.category === "gender" ? v[0] : v;
    const need = [];
    Object.entries(rosterMinimums.minimums).forEach(([val, n]) => {
      const have = rosterCounts[val] || 0;
      if (have < (Number(n) || 0)) need.push(`${(Number(n)||0) - have} more ${shortVal(val)}`);
    });
    const summary = Object.entries(rosterMinimums.minimums)
      .map(([val]) => `${rosterCounts[val] || 0}${shortVal(val)}`)
      .join(" / ");
    if (need.length === 0) return `${summary} · OK`;
    return `${summary} · Need ${need.join(", ")}`;
  })();

  // While Final Lock-In is open (and this team hasn't confirmed yet), waive
  // the weekly 1-swap limit so the player can freely pick their final roster.
  const lockInOpenForTeam =
    isLockInEligible(league) &&
    getLockInStatus(league) === "open" &&
    team && !(team.lockedRoster && team.lockedRoster.length > 0);
  const swapLimitReached = currentWeek > 1 && swapsMade >= 1 && !lockInOpenForTeam;

  useEffect(() => {
    if (team) {
      if (editingWeek) {
        setLocalChart(team.weeklyDepthCharts?.[String(editingWeek)] || team.depthChart || { captain: null, coCaptain: null, regulars: [] });
      } else {
        setLocalChart(team.depthChart || { captain: null, coCaptain: null, regulars: [] });
      }
      setTeamName(team.name || "");
    }
  }, [selectedTeam, league, editingWeek]);

  function isNewPlayer(cid) {
    if (!lastWeekChart || lastWeekRosterIds.size === 0) return false;
    return cid && !lastWeekRosterIds.has(cid);
  }

  function canSelectPlayer(cid, currentSlotValue, isReplacingNewPlayer) {
    if (!cid) return true;
    if (lastWeekRosterIds.has(cid)) return true;
    if (cid === currentSlotValue) return true;
    if (!lastWeekChart || lastWeekRosterIds.size === 0) return true;
    if (isReplacingNewPlayer) return true;
    if (!swapLimitReached) return true;
    if (currentRosterIds.has(cid)) return true;
    return false;
  }

  function getSlotValue(chart, slot) {
    if (slot === "captain") return chart.captain;
    if (slot === "coCaptain") return chart.coCaptain;
    const idx = Number(slot.replace("regular_",""));
    return (chart.regulars||[])[idx] || null;
  }

  function findSlotForPlayer(chart, playerId) {
    if (!playerId) return null;
    if (chart.captain === playerId) return "captain";
    if (chart.coCaptain === playerId) return "coCaptain";
    const idx = (chart.regulars||[]).indexOf(playerId);
    if (idx >= 0) return `regular_${idx}`;
    return null;
  }

  function setSlotWithSwap(slot, contestantId) {
    const id = contestantId || null;
    const nc = { ...localChart, regulars: [...(localChart.regulars||[])] };
    const currentInSlot = getSlotValue(nc, slot);
    
    // If the new player is already on the roster in another slot, swap
    if (id) {
      const otherSlot = findSlotForPlayer(nc, id);
      if (otherSlot && otherSlot !== slot) {
        // Put the current slot's player into the other slot
        if (otherSlot === "captain") nc.captain = currentInSlot;
        else if (otherSlot === "coCaptain") nc.coCaptain = currentInSlot;
        else { nc.regulars[Number(otherSlot.replace("regular_",""))] = currentInSlot; }
      }
    }

    // Set the target slot
    if (slot === "captain") nc.captain = id;
    else if (slot === "coCaptain") nc.coCaptain = id;
    else {
      const idx = Number(slot.replace("regular_",""));
      if (id) { nc.regulars[idx] = id; } else { nc.regulars.splice(idx, 1); }
    }
    setLocalChart(nc);
  }

  function saveDepthChart() {
    if (!genderConstraintMet) return;
    const weekNum = String(effectiveWeek);
    const updatedTeams = league.teams.map(t => t.id !== selectedTeam ? t : {
      ...t,
      name: teamName.trim() || t.name,
      // Only update current depthChart if editing current week
      depthChart: editingWeek ? t.depthChart : { ...localChart },
      weeklyDepthCharts: { ...(t.weeklyDepthCharts||{}), [weekNum]: { ...localChart } },
    });
    // v2.6.1.0 + v2.6.2.0: only audit-log when the roster CONTENT actually
    // changed (contestants on the chart or their positions). Cosmetic edits
    // like team-name-only saves are filtered out so league members aren't
    // notified about every tweak. Critically still flags commissioner-while-
    // locked edits as the "looking at you commissioners" red flag.
    const editedTeam = league.teams.find(t => t.id === selectedTeam);
    const prevChart = editingWeek
      ? (editedTeam?.weeklyDepthCharts?.[String(editingWeek)] || editedTeam?.depthChart || {})
      : (editedTeam?.depthChart || {});
    const sig = (c) => JSON.stringify({
      captain: c?.captain || null,
      coCaptain: c?.coCaptain || null,
      regulars: [...(c?.regulars || [])].sort(),
      mode: c?.mode,
      heroCouple: [...(c?.heroCouple || [])].sort(),
      sidekickCouple: [...(c?.sidekickCouple || [])].sort(),
    });
    const orderSig = (c) => JSON.stringify({
      captain: c?.captain || null,
      coCaptain: c?.coCaptain || null,
      regulars: c?.regulars || [],
    });
    const contentChanged = sig(prevChart) !== sig(localChart);
    const orderChanged = !contentChanged && orderSig(prevChart) !== orderSig(localChart);
    let nextLeague = { ...league, teams: updatedTeams };
    if (contentChanged || orderChanged) {
      const isOwnTeam = selectedTeam === myTeamId;
      const wasLocked = isRosterLocked(league);
      const actorName = userProfile?.displayName || (isCommissioner ? "Commissioner" : "Manager");
      const verb = contentChanged ? "changed" : "reordered";
      const target = isCommissioner && !isOwnTeam
        ? `${editedTeam?.name || "a team"}'s roster`
        : `${editedTeam?.name || "their"} roster`;
      const lockedSuffix = wasLocked ? " — while rosters were LOCKED" : "";
      const audited = appendAudit(league, {
        type: wasLocked ? "roster-locked" : "roster",
        actorName,
        desc: `${actorName} ${verb} ${target}${lockedSuffix}`,
        meta: { teamId: selectedTeam, week: weekNum, byCommissioner: !!isCommissioner && !isOwnTeam, wasLocked, contentChanged, orderChanged },
      });
      nextLeague = { ...audited, teams: updatedTeams };
    }
    onUpdate(nextLeague);
    setEditingName(false);
  }

  function discardRosterChanges() {
    if (team) {
      if (editingWeek) {
        setLocalChart(team.weeklyDepthCharts?.[String(editingWeek)] || team.depthChart || { captain: null, coCaptain: null, regulars: [] });
      } else {
        setLocalChart(team.depthChart || { captain: null, coCaptain: null, regulars: [] });
      }
    }
  }

  function saveNameOnly() {
    const updatedTeams = league.teams.map(t => t.id !== selectedTeam ? t : { ...t, name: teamName.trim() || t.name });
    onUpdate({ ...league, teams: updatedTeams });
    setEditingName(false);
  }

  function getContestantDisplayInfo(cid) {
    const c = (league.contestants||[]).find(x=>x.id===cid);
    if (!c) return null;
    const ranking = contestantRankings[cid] || { rank: "?", total: 0 };
    const lastWkPts = weeks.length > 0 ? calcContestantWeekPoints(league.weeklyScores?.[weeks[weeks.length-1]]||{}, cid) : 0;
    const tribeColor = getTribeColor(league, c);
    const isMerged = league.merged || false;
    let bestWeek = null, bestPts = -Infinity;
    weeks.forEach(w => { const pts = calcContestantWeekPoints(league.weeklyScores?.[w]||{}, cid); if (pts > bestPts) { bestPts = pts; bestWeek = w; } });
    return { ...c, ranking, lastWkPts: Math.round(lastWkPts*100)/100, tribeColor, bestWeek, bestPts: Math.round(bestPts*100)/100, isMerged };
  }

  function RosterRow({ label, slot, currentId, multiplierLabel, multiplierNum, color }) {
    // Available: all active contestants that pass swap rules (no duplicate filtering — swaps handle it)
    const isSwapped = isNewPlayer(currentId);
    const available = activeContestants.filter(c => canSelectPlayer(c.id, currentId, isSwapped));
    const isInDropdown = currentId && available.some(c => c.id === currentId);
    const c = currentId ? (league.contestants||[]).find(x=>x.id===currentId) : null;
    const tribeColor = c ? getTribeColor(league, c) : "#2a2a4a";
    const weekBasePts = c ? calcContestantWeekPoints(league.weeklyScores?.[String(effectiveWeek)]||{}, c.id) : 0;
    const weekMultPts = Math.round(weekBasePts * multiplierNum * 100) / 100;

    // Mark players already on roster in dropdown
    const onRosterSlot = (cid) => findSlotForPlayer(localChart, cid);

    return (
      <div style={{ padding:"12px 14px",borderBottom:"1px solid #1a1a30" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          {/* Role badge */}
          <div style={{ width:38,height:38,borderRadius:8,background:`${color}18`,border:`1px solid ${color}33`,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
            <div style={{ fontSize:12,fontWeight:800,color,lineHeight:1 }}>{label}</div>
            <div style={{ fontSize:9,color:`${color}99` }}>{multiplierLabel}</div>
          </div>
          {/* Contestant avatar */}
          {c && <ContestantAvatar contestant={c} league={league} size={28} />}
          {/* Player selector — always the dropdown */}
          <div style={{ flex:1,minWidth:0,position:"relative" }}>
            <select value={currentId||""} onChange={e=>setSlotWithSwap(slot,e.target.value)} style={{
              width:"100%",padding:"8px 10px",background:c?"transparent":"#0d0d18",
              border:c?"1px solid transparent":"1px solid #2a2a4a",
              borderRadius:6,color:c?"#e8e8f0":"#6a6a8a",fontSize:13,fontWeight:c?600:400,
              fontFamily:"'Outfit',sans-serif",cursor:"pointer",
              appearance:c?"none":"auto",WebkitAppearance:c?"none":"auto",
            }}>
              <option value="">{c ? (isSwapped ? "— Remove swap —" : "— Remove player —") : "— Select contestant —"}</option>
              {c && !isInDropdown && <option value={currentId}>{c.name} (eliminated)</option>}
              {(()=>{
                // Group available contestants by tribe, then alphabetical
                const tribes = league.tribes || {};
                const isMerged = league.merged || false;
                const tribeNames = Object.keys(tribes);
                const grouped = {};
                const noTribe = [];
                available.forEach(a => {
                  const tribeName = !isMerged && a.tribe ? a.tribe : null;
                  if (tribeName) {
                    if (!grouped[tribeName]) grouped[tribeName] = [];
                    grouped[tribeName].push(a);
                  } else {
                    noTribe.push(a);
                  }
                });
                // Sort within each group
                Object.values(grouped).forEach(arr => arr.sort((a,b) => a.name.localeCompare(b.name)));
                noTribe.sort((a,b) => a.name.localeCompare(b.name));
                // Build options
                const options = [];
                const orderedTribes = tribeNames.filter(t => grouped[t]?.length > 0);
                orderedTribes.forEach(tribeName => {
                  options.push(<optgroup key={tribeName} label={tribeName}>
                    {grouped[tribeName].map(a => {
                      const existingSlot = onRosterSlot(a.id);
                      const isCurrentSlot = a.id === currentId;
                      return <option key={a.id} value={a.id}>
                        {a.name}{a.gender ? ` (${a.gender.charAt(0)})` : ""}{existingSlot && !isCurrentSlot ? ` (swap ${existingSlot==="captain"?"C":existingSlot==="coCaptain"?"CC":"R"+(Number(existingSlot.replace("regular_",""))+1)})` : ""}{isNewPlayer(a.id)&&!currentRosterIds.has(a.id)?" ★":""}
                      </option>;
                    })}
                  </optgroup>);
                });
                if (noTribe.length > 0) {
                  const label = orderedTribes.length > 0 ? "Other" : "Contestants";
                  options.push(<optgroup key="__none" label={label}>
                    {noTribe.map(a => {
                      const existingSlot = onRosterSlot(a.id);
                      const isCurrentSlot = a.id === currentId;
                      return <option key={a.id} value={a.id}>
                        {a.name}{a.gender ? ` (${a.gender.charAt(0)})` : ""}{existingSlot && !isCurrentSlot ? ` (swap ${existingSlot==="captain"?"C":existingSlot==="coCaptain"?"CC":"R"+(Number(existingSlot.replace("regular_",""))+1)})` : ""}{isNewPlayer(a.id)&&!currentRosterIds.has(a.id)?" ★":""}
                      </option>;
                    })}
                  </optgroup>);
                }
                return options;
              })()}
            </select>
            {c && (
              <div style={{ position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",pointerEvents:"none" }}>
                <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                  {isSwapped && <span style={{ fontSize:11,color:"#f5a623" }}>★</span>}
                  {!league.merged && c.tribe && <span style={{ fontSize:9,color:tribeColor }}>{c.tribe}</span>}
                  <span style={{ color:"#4a4a6a",fontSize:10 }}>▾</span>
                </div>
              </div>
            )}
          </div>
          {/* Week pts */}
          <div style={{ width:46,textAlign:"right",flexShrink:0 }}>
            {c ? (
              <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:16,fontWeight:800,
                color:weekMultPts>0?"#4ecdc4":weekMultPts<0?"#e94560":"#4a4a6a" }}>
                <SpoilerText active={spoilerActive}>{weekMultPts !== 0 ? (weekMultPts>0?"+":"") + formatPts(weekMultPts, league) : "—"}</SpoilerText>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (!team) return <EmptyState message="No team found." />;

  // Calculate team week total
  const teamWeekTotal = Math.round(calcTeamWeekPoints(league, team, String(currentWeek)) * 10) / 10;

  return (
    <div>
      {/* Header with editable team name */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8 }}>
        <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>
          {lockedToTeamId ? "My Roster" : "Depth Chart"}
        </h3>
        <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
          {genderChipLabel && <Badge color={genderConstraintMet ? "#4ecdc4" : "#e94560"}>{genderChipLabel}</Badge>}
          <Badge color="#f5a623">{cadenceLabel(league, effectiveWeek)}</Badge>
        </div>
      </div>

      {/* Week selector for commissioners to edit past weeks */}
      {isCommissioner && currentWeek > 1 && (
        <div style={{ marginBottom:14 }}>
          <Select label="" value={editingWeek ? String(editingWeek) : ""} onChange={e=>{
            const v = e.target.value;
            setEditingWeek(v ? Number(v) : null);
          }} options={[
            { value: "", label: "Current " + cadenceWord(league).toLowerCase() + " (" + currentWeek + ")" },
            ...Array.from({length:currentWeek-1},(_,i)=>({ value: String(i+1), label: cadenceLabel(league, i+1) + " (past)" })).reverse()
          ]} />
        </div>
      )}
      {editingWeek && (
        <div style={{ padding:"10px 14px",background:"#e9456011",borderRadius:8,border:"1px solid #e9456033",marginBottom:14 }}>
          <div style={{ fontSize:12,color:"#e94560",lineHeight:1.5,fontWeight:600 }}>Editing {cadenceLabel(league, editingWeek)} roster for {team?.name || "this team"}. Changes will only affect this {cadenceWord(league).toLowerCase()}'s scoring.</div>
        </div>
      )}

      {/* Best Ball banner */}
      {league.bestBall && (
        <div style={{ padding:"10px 14px",background:"#4ecdc411",borderRadius:8,border:"1px solid #4ecdc433",marginBottom:14 }}>
          <div style={{ fontSize:12,color:"#4ecdc4",lineHeight:1.5,fontWeight:600 }}>Best Ball is ON — your lineup is auto-optimized each {cadenceWord(league).toLowerCase()}. The highest scorer gets Hero (2x), second gets Side-Kick (1.5x), rest get Vigilante (1x).</div>
        </div>
      )}

      {/* Team identity card */}
      {lockedToTeamId ? (
        <div style={{ marginBottom:14,padding:"14px 16px",background:"#12121f",borderRadius:12,border:"1px solid #1e1e38" }}>
          {editingName ? (
            <div style={{ display:"flex",gap:8,alignItems:"center" }}>
              <input value={teamName} onChange={e=>setTeamName(e.target.value)} style={{
                flex:1,padding:"8px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",
                borderRadius:6,color:"#e8e8f0",fontSize:15,fontWeight:700,fontFamily:"'Anybody',sans-serif",
              }} autoFocus />
              <Btn small onClick={saveNameOnly}><Icon name="save" size={12}/></Btn>
              <Btn small variant="ghost" onClick={()=>{setEditingName(false);setTeamName(team.name)}}>Cancel</Btn>
            </div>
          ) : (
            <>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                {team.teamAvatar ? (
                  <img src={team.teamAvatar} alt={team.name} style={{ width:40,height:40,borderRadius:10,objectFit:"cover",border:"2px solid "+(team.teamColor||"#e94560") }} />
                ) : (
                  <div style={{ width:40,height:40,borderRadius:10,background:team.teamColor||"#e94560",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff" }}>{team.name?.[0]}</div>
                )}
                <div>
                  <div style={{ color:"#e8e8f0",fontWeight:700,fontSize:18,fontFamily:"'Anybody',sans-serif" }}>{team.name}</div>
                  <div style={{ color:"#6a6a8a",fontSize:12,marginTop:2 }}>Managed by {team.owner}</div>
                </div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:22,fontWeight:900,
                    color:teamWeekTotal>0?"#4ecdc4":teamWeekTotal<0?"#e94560":"#6a6a8a" }}>
                    <SpoilerText active={spoilerActive}>{teamWeekTotal>0?"+":""}{formatPts(teamWeekTotal, league)}</SpoilerText>
                  </div>
                  <div style={{ fontSize:10,color:"#6a6a8a" }}>{cadenceShort(league).toLowerCase()} {currentWeek} total</div>
                </div>
                <button onClick={()=>setEditingName(true)} style={{ background:"none",border:"none",color:"#6a6a8a",cursor:"pointer",padding:4 }}>
                  <Icon name="edit" size={14}/>
                </button>
              </div>
            </div>
            </>
          )}
        </div>
      ) : (
        <div style={{ marginBottom:14 }}>
          <Select label="Select Team" value={selectedTeam} onChange={e=>setSelectedTeam(e.target.value)}
            options={(league.teams||[]).map(t=>({value:t.id,label:`${t.name} (${t.owner})`}))} />
        </div>
      )}

      {/* Customize button — always visible when a team is selected */}
      {team && (
        <div style={{ marginBottom:14 }}>
          <Btn small variant="ghost" onClick={()=>{
            setCustomColor(team.teamColor||"#e94560");
            setCustomAvatar(team.teamAvatar||"");
            setCustomName(team.name||"");
            setShowCustomize(true);
          }}><Icon name="edit" size={12}/> Customize Team</Btn>
        </div>
      )}

      {/* Customize Team Overlay */}
      {showCustomize && team && (
        <div onClick={()=>setShowCustomize(false)} style={{
          position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.7)",
          display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:20
        }}>
          <div onClick={e=>e.stopPropagation()} style={{
            background:"#12121f",borderRadius:16,border:"1px solid #2a2a4a",padding:"24px",
            width:360,maxWidth:"90vw",maxHeight:"85vh",overflowY:"auto",
            boxShadow:"0 24px 80px rgba(0,0,0,0.5)"
          }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
              <h3 style={{ margin:0,fontSize:18,color:"#e8e8f0",fontFamily:"'Anybody',sans-serif",fontWeight:700 }}>Customize Team</h3>
              <button onClick={()=>setShowCustomize(false)} style={{ background:"none",border:"none",color:"#888",cursor:"pointer",padding:4 }}><Icon name="x" size={20}/></button>
            </div>

            {/* Preview */}
            <div style={{ textAlign:"center",marginBottom:20 }}>
              {customAvatar ? (
                <img src={customAvatar} alt="Team" style={{ width:64,height:64,borderRadius:16,objectFit:"cover",border:"3px solid "+customColor,margin:"0 auto" }} onError={e=>{e.target.style.display="none"}} />
              ) : (
                <div style={{ width:64,height:64,borderRadius:16,background:customColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:800,color:"#fff",margin:"0 auto" }}>{customName?.[0]||"?"}</div>
              )}
              <div style={{ color:"#e8e8f0",fontWeight:700,fontSize:16,fontFamily:"'Anybody',sans-serif",marginTop:8 }}>{customName}</div>
            </div>

            <Input label="Team Name" value={customName} onChange={e=>setCustomName(e.target.value)} />
            <Input label="Avatar URL (optional)" placeholder="https://example.com/avatar.png" value={customAvatar} onChange={e=>setCustomAvatar(e.target.value)} />

            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block",fontSize:12,color:"#8888aa",marginBottom:5,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em" }}>Team Color</label>
              <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
                {["#e94560","#4ecdc4","#f5a623","#9d5dff","#4d8aff","#ff5da0","#3ddc84","#ff8a3d","#ff4d6a","#6a6aff","#ff6b35","#00b4d8"].map(c => (
                  <button key={c} onClick={()=>setCustomColor(c)} style={{
                    width:32,height:32,borderRadius:8,background:c,border:customColor===c?"3px solid #fff":"2px solid transparent",
                    cursor:"pointer",transition:"all .15s"
                  }}/>
                ))}
              </div>
            </div>

            <div style={{ display:"flex",gap:8,marginTop:20 }}>
              <Btn variant="ghost" onClick={()=>setShowCustomize(false)} style={{ flex:1,justifyContent:"center" }}>Cancel</Btn>
              <Btn onClick={()=>{
                const updatedTeams = league.teams.map(t=>t.id===team.id?{...t,name:customName.trim()||team.name,teamColor:customColor,teamAvatar:customAvatar.trim()||null}:t);
                onUpdate({...league, teams: updatedTeams});
                setShowCustomize(false);
              }} style={{ flex:1,justifyContent:"center" }}>Save</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Swap tracker */}
      {currentWeek > 1 && lastWeekRosterIds.size > 0 && !lockInOpenForTeam && !teamLocked && (
        <div style={{
          padding:"10px 14px",borderRadius:8,marginBottom:14,
          background: swapLimitReached ? "#e9456011" : "#4ecdc411",
          border: swapLimitReached ? "1px solid #e9456033" : "1px solid #4ecdc433",
        }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div style={{ fontSize:12,fontWeight:600,color:swapLimitReached?"#e94560":"#4ecdc4" }}>
              {cadenceWord(league)} Swap: {swapsMade} / 1 used
            </div>
            {swapLimitReached && <span style={{ fontSize:10,color:"#e94560" }}>Swap limit reached</span>}
          </div>
          <div style={{ fontSize:11,color:"#6a6a8a",marginTop:4 }}>
            {swapLimitReached
              ? "You've used your swap. You can still reorganize positions freely."
              : "You may swap 1 contestant and reorganize freely."}
          </div>
        </div>
      )}

      {currentWeek <= 1 && (
        <div style={{ padding:"10px 14px",background:"#f5a62311",borderRadius:8,border:"1px solid #f5a62333",marginBottom:14 }}>
          <div style={{ fontSize:12,color:"#f5a623",lineHeight:1.5 }}>{cadenceLabel(league, 1)} — set your initial roster freely.</div>
        </div>
      )}

      {/* Roster locked banner */}
      {isRosterLocked(league) && !isCommissioner && (
        <div style={{ padding:"10px 14px",background:"#e9456011",borderRadius:8,border:"1px solid #e9456033",marginBottom:14,display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:16 }}>🔒</span>
          <div style={{ fontSize:12,color:"#e94560",lineHeight:1.4 }}>Rosters are locked. Changes are disabled until the commissioner unlocks them.</div>
        </div>
      )}
      {isRosterLocked(league) && isCommissioner && (
        <div style={{ padding:"10px 14px",background:"#f5a62311",borderRadius:8,border:"1px solid #f5a62333",marginBottom:14,display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:16 }}>🔒</span>
          <div style={{ flex:1,fontSize:12,color:"#f5a623",lineHeight:1.4 }}>Rosters are locked for managers. You can still edit as commissioner.</div>
        </div>
      )}

      {/* Locked roster read-only card (visible to anyone whose viewed team is locked) */}
      {teamLocked && team && (
        <div style={{ marginBottom:14,padding:"12px 14px",background:"#4ecdc411",borderRadius:10,border:"1px solid #4ecdc433" }}>
          <div style={{ fontSize:12,fontWeight:700,color:"#4ecdc4",marginBottom:6,display:"flex",alignItems:"center",gap:6 }}>
            🔒 Locked Roster
          </div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
            {(team.lockedRoster||[]).map(cid => {
              const c = (league.contestants||[]).find(x=>x.id===cid);
              if (!c) return null;
              const elim = c.status === "eliminated";
              return (
                <span key={cid} style={{ padding:"4px 8px",borderRadius:6,background:"#0d0d18",border:"1px solid #1e1e38",fontSize:11,color:elim?"#6a6a8a":"#e8e8f0" }}>
                  {c.name}{elim?" (eliminated)":""}
                </span>
              );
            })}
          </div>
          <div style={{ fontSize:10,color:"#6a6a8a",marginTop:6 }}>
            Contestants are locked. Depth chart positions are still editable.
          </div>
        </div>
      )}

      {/* Pill bar: switch between Depth Chart editor, Game Log, and league-wide Polls */}
      <div style={{ display:"flex",gap:6,marginBottom:14,flexWrap:"wrap" }}>
        {[
          { id:"depth", label:"Depth Chart" },
          { id:"log", label:"Team History" },
        ].map(m => (
          <button key={m.id} onClick={()=>setMyRosterMode(m.id)} style={{
            padding:"6px 14px",borderRadius:99,border:myRosterMode===m.id?"1px solid #e9456044":"1px solid #1e1e38",
            background:myRosterMode===m.id?"#e9456018":"transparent",color:myRosterMode===m.id?"#e94560":"#7a7a9a",
            fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .15s",
          }}>{m.label}</button>
        ))}
      </div>

      {myRosterMode === "depth" && <>
      {/* Roster table */}
      <div style={{ background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",overflow:"hidden",
        opacity:(isRosterLocked(league) && !isCommissioner) ? 0.5 : 1,pointerEvents:(isRosterLocked(league) && !isCommissioner) ? "none" : "auto" }}>
        <div style={{ display:"flex",alignItems:"center",padding:"10px 12px",background:"#0d0d18",borderBottom:"1px solid #1e1e38" }}>
          <div style={{ width:38,fontSize:10,fontWeight:600,color:"#4a4a6a",textAlign:"center",flexShrink:0 }}>Slot</div>
          <div style={{ flex:1,fontSize:10,fontWeight:600,color:"#4a4a6a",paddingLeft:10 }}>Player</div>
          <div style={{ width:46,fontSize:10,fontWeight:600,color:"#4a4a6a",textAlign:"right" }}>{cadenceShort(league)} {effectiveWeek}</div>
        </div>
        <RosterRow label="H" slot="captain" currentId={localChart.captain} multiplierLabel="2×" multiplierNum={2} color="#f5a623" />
        <RosterRow label="SK" slot="coCaptain" currentId={localChart.coCaptain} multiplierLabel="1.5×" multiplierNum={1.5} color="#4ecdc4" />
        {Array.from({length:regularSlots}).map((_,i) => (
          <RosterRow key={i} label={`V${i+1}`} slot={`regular_${i}`} currentId={(localChart.regulars||[])[i]} multiplierLabel="1×" multiplierNum={1} color="#8888aa" />
        ))}
      </div>

      {/* ─── Final Lock-In confirm (Heroes only, when lock-in is open on your team) ─── */}
      {isLockInEligible(league) && team && team.id === myTeamId &&
       getLockInStatus(league) === "open" &&
       !(team.lockedRoster && team.lockedRoster.length > 0) && (
        <div style={{ marginTop:14,padding:"12px 14px",background:"#f5a62311",borderRadius:10,border:"1px solid #f5a62333",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap" }}>
          <div style={{ fontSize:12,color:"#f5a623",fontWeight:600,flex:1,minWidth:180 }}>
            🔒 Final Lock-In is open. Set your roster above, then confirm to lock it for the rest of the season.
          </div>
          <Btn small onClick={()=>{
            // Use localChart (what the user sees in the dropdowns right now),
            // not team.depthChart (last saved state) — unsaved edits must count.
            const chart = localChart || { captain: null, coCaptain: null, regulars: [] };
            const current = [chart.captain, chart.coCaptain, ...(chart.regulars || [])].filter(Boolean);
            const expectedSize = 2 + regularSlots;
            if (current.length < expectedSize) {
              alert(`Fill all ${expectedSize} roster slots above before confirming.`);
              return;
            }
            if (!confirm("Lock in this roster as your final roster? You won't be able to swap contestants after this — only adjust depth chart positions.")) return;
            // Save the depth chart AND the locked roster in one update.
            const updatedTeams = league.teams.map(t =>
              t.id === team.id
                ? {
                    ...t,
                    depthChart: { ...chart },
                    weeklyDepthCharts: { ...(t.weeklyDepthCharts||{}), [String(currentWeek)]: { ...chart } },
                    lockedRoster: [...current],
                    lockInConfirmedAt: Date.now(),
                  }
                : t
            );
            onUpdate({ ...league, teams: updatedTeams });
          }}>Confirm Final Roster</Btn>
        </div>
      )}

      {/* Hot Picks + Most Rostered side-by-side. flexWrap means they stack on
          narrow viewports (the 280px flex-basis is the breakpoint). */}
      <div style={{ marginTop:20,display:"flex",gap:16,flexWrap:"wrap",alignItems:"flex-start" }}>
      {/* ─── HOT PICKS: Who should I roster? ─── */}
      {!isRosterLocked(league) && (()=>{
        const rosteredIds = new Set();
        if (localChart.captain) rosteredIds.add(localChart.captain);
        if (localChart.coCaptain) rosteredIds.add(localChart.coCaptain);
        (localChart.regulars||[]).forEach(id => rosteredIds.add(id));

        const available = activeContestants.filter(c => !rosteredIds.has(c.id));
        const ranked = available.map(c => {
          const total = weeks.reduce((s,w) => s + calcContestantWeekPoints(league.weeklyScores?.[w]||{}, c.id), 0);
          const prevWeek = String((league.currentWeek||1) - 1);
          const lastWk = prevWeek !== "0" ? calcContestantWeekPoints(league.weeklyScores?.[prevWeek]||{}, c.id) : 0;
          return { ...c, total: Math.round(total*100)/100, lastWk: Math.round(lastWk*100)/100, tribeColor: getTribeColor(league, c) };
        }).sort((a,b) => b.total - a.total).slice(0, 5);

        // Always render the Hot Picks section header so the panel stays visible
        // even when the user already rosters every top scorer — empty state shows
        // a placeholder instead of returning null (which made Hot Picks vanish
        // and read as if it had been replaced by Most Rostered below).
        return (
          <div style={{ flex:"1 1 280px",minWidth:0 }}>
            <div style={{ fontSize:14,fontWeight:800,fontFamily:"'Anybody',sans-serif",color:"#f0f0f5",marginBottom:10,display:"flex",alignItems:"center",gap:6 }}>
              <span style={{ fontSize:16 }}>🔥</span> Hot Picks
            </div>
            <div style={{ fontSize:11,color:"#6a6a8a",marginBottom:10 }}>Top available contestants not on your roster</div>
            {ranked.length === 0 ? (
              <div style={{ padding:"14px",textAlign:"center",color:"#6a6a8a",fontSize:12,background:"#12121f",borderRadius:10,border:"1px dashed #2a2a4a" }}>
                You've already rostered every top-scoring contestant. Nothing left to recommend.
              </div>
            ) : (
              <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
                {ranked.map((c,i) => (
                  <div key={c.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
                    <ContestantAvatar contestant={c} league={league} size={28} />
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ color:"#e8e8f0",fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{c.name}</div>
                      <div style={{ fontSize:10,color:"#6a6a8a" }}>#{contestantRankings[c.id]?.rank || "?"} overall{c.lastWk!==0?` · Last wk: ${c.lastWk>0?"+":""}${formatPts(c.lastWk, league)}`:""}</div>
                    </div>
                    <div style={{ textAlign:"right",flexShrink:0 }}>
                      <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:15,fontWeight:800,color:c.total>0?"#4ecdc4":c.total<0?"#e94560":"#6a6a8a" }}><SpoilerText active={spoilerActive}>{c.total>0?"+":""}{formatPts(c.total, league)}</SpoilerText></div>
                      <div style={{ fontSize:9,color:"#4a4a6a" }}>season</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ─── MOST ROSTERED: Who's on the most depth charts league-wide? ─── */}
      {(()=> {
        const teamsArr = league.teams || [];
        const totalTeams = teamsArr.length;
        if (totalTeams === 0) return null;
        // Tally each contestant's appearances across every team's current roster.
        // Captains uses the current depthChart; Standard uses the current week's
        // weeklyRosters. Pure read — no scoring math, no per-week aggregation.
        const counts = {};
        teamsArr.forEach(t => {
          const ids = new Set();
          if (league.format === "captains") {
            const dc = t.depthChart || {};
            if (dc.captain) ids.add(dc.captain);
            if (dc.coCaptain) ids.add(dc.coCaptain);
            (dc.regulars||[]).forEach(id => ids.add(id));
          } else {
            const wr = t.weeklyRosters?.[String(currentWeek)] || [];
            wr.forEach(id => ids.add(id));
          }
          ids.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
        });
        const ranked = activeContestants
          .map(c => ({ ...c, count: counts[c.id] || 0 }))
          .filter(c => c.count > 0)
          .sort((a, b) => b.count - a.count || b.id.localeCompare(a.id))
          .slice(0, 5);
        if (ranked.length === 0) return null;
        return (
          <div style={{ flex:"1 1 280px",minWidth:0 }}>
            <div style={{ fontSize:14,fontWeight:800,fontFamily:"'Anybody',sans-serif",color:"#f0f0f5",marginBottom:10,display:"flex",alignItems:"center",gap:6 }}>
              <span style={{ fontSize:16 }}>👥</span> Most Rostered
            </div>
            <div style={{ fontSize:11,color:"#6a6a8a",marginBottom:10 }}>Contestants picked by the most managers</div>
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              {ranked.map(c => {
                const pct = Math.round((c.count / totalTeams) * 100);
                const onMyRoster = (localChart.captain === c.id) || (localChart.coCaptain === c.id) || (localChart.regulars||[]).includes(c.id);
                return (
                  <div key={c.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
                    <ContestantAvatar contestant={c} league={league} size={28} />
                    <div style={{ flex:1,minWidth:0 }}>
                      <div style={{ color:"#e8e8f0",fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",display:"flex",alignItems:"center",gap:6 }}>
                        {c.name}
                        {onMyRoster && <span style={{ fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:3,background:"#4ecdc418",color:"#4ecdc4" }}>ROSTERED</span>}
                      </div>
                      <div style={{ fontSize:10,color:"#6a6a8a" }}>On {c.count} of {totalTeams} roster{totalTeams===1?"":"s"} · {pct}%</div>
                    </div>
                    <div style={{ textAlign:"right",flexShrink:0 }}>
                      <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:15,fontWeight:800,color:"#f5a623" }}>{c.count}/{totalTeams}</div>
                      <div style={{ fontSize:9,color:"#4a4a6a" }}>rostered</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
      </div>
      </>}

      {/* ─── TEAM HISTORY (per-week breakdown of past depth charts) ─── */}
      {myRosterMode === "log" && weeks.length > 0 && team && (
        <div>
          <h4 style={{ fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:15,color:"#e8e8f0",marginBottom:12,margin:"0 0 12px" }}>Team History</h4>
          {[...weeks].reverse().map(w => {
            const weekChart = team.weeklyDepthCharts?.[w] || (w === String(currentWeek) ? team.depthChart : null);
            if (!weekChart) return null;
            const captain = weekChart.captain ? (league.contestants||[]).find(c=>c.id===weekChart.captain) : null;
            const coCaptain = weekChart.coCaptain ? (league.contestants||[]).find(c=>c.id===weekChart.coCaptain) : null;
            const regulars = (weekChart.regulars||[]).map(id=>(league.contestants||[]).find(c=>c.id===id)).filter(Boolean);
            const allRoster = [
              ...(captain ? [{ c: captain, mult: 2, role: "H" }] : []),
              ...(coCaptain ? [{ c: coCaptain, mult: 1.5, role: "SK" }] : []),
              ...regulars.map(c => ({ c, mult: 1, role: "V" })),
            ];
            const teamTotal = allRoster.reduce((s, { c, mult }) => {
              return s + calcContestantWeekPoints(league.weeklyScores?.[w]||{}, c.id) * mult;
            }, 0);
            const isCurrentWeek = w === String(currentWeek);
            return (
              <div key={w} style={{ marginBottom:10,padding:"12px 14px",background:isCurrentWeek?"#12121f":"#0d0d18",
                borderRadius:10,border:isCurrentWeek?"1px solid #2a2a4a":"1px solid #1a1a30" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                  <div style={{ fontSize:13,fontWeight:700,color:"#e8e8f0" }}>
                    {cadenceLabel(league, w)}{isCurrentWeek ? " (current)" : ""}
                  </div>
                  <SpoilerText active={spoilerActive}>
                    <span style={{ fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:15,
                      color:teamTotal>0?"#4ecdc4":teamTotal<0?"#e94560":"#6a6a8a" }}>
                      {teamTotal>0?"+":""}{formatPts(Math.round(teamTotal*100)/100, league)}
                    </span>
                  </SpoilerText>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                  {allRoster.map(({ c, mult, role }) => {
                    const basePts = calcContestantWeekPoints(league.weeklyScores?.[w]||{}, c.id);
                    const multPts = Math.round(basePts * mult * 100) / 100;
                    const roleColor = role==="H"?"#f5a623":role==="SK"?"#4ecdc4":"#8888aa";
                    return (
                      <div key={c.id} style={{ display:"flex",alignItems:"center",gap:8,padding:"4px 0" }}>
                        <span style={{ fontSize:10,fontWeight:700,color:roleColor,width:20,textAlign:"center" }}>{role}</span>
                        {c.photoUrl && <img src={c.photoUrl} alt="" style={{ width:20,height:20,borderRadius:5,objectFit:"cover",objectPosition:`center ${c.photoCropY||20}%` }} onError={e=>{e.target.style.display="none"}} />}
                        <span style={{ flex:1,fontSize:12,color:c.status==="eliminated"?"#6a6a8a":"#e8e8f0",
                          textDecoration:c.status==="eliminated"?"line-through":"none" }}>{c.name}</span>
                        <SpoilerText active={spoilerActive}>
                          <span style={{ fontSize:12,fontWeight:600,fontFamily:"'Anybody',sans-serif",
                            color:multPts>0?"#4ecdc4":multPts<0?"#e94560":"#6a6a8a" }}>
                            {multPts!==0 ? (multPts>0?"+":"") + formatPts(multPts, league) : "—"}
                          </span>
                        </SpoilerText>
                        {mult !== 1 && <span style={{ fontSize:9,color:"#6a6a8a" }}>×{mult}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {myRosterMode === "log" && weeks.length === 0 && (
        <EmptyState message="No weeks scored yet. Team History will populate as scoring happens." />
      )}

      {myRosterMode === "depth" && hasChanges && (
        <div style={{ position:"sticky",bottom:16,marginTop:12,padding:"14px 16px",background:"linear-gradient(135deg,#0a1a18,#12121f)",borderRadius:14,border:`1px solid ${genderConstraintMet ? "#4ecdc4" : "#e94560"}`,
          display:"flex",flexDirection:"column",gap:8,alignItems:"stretch",boxShadow:`0 -4px 24px ${genderConstraintMet ? "rgba(78,205,196,0.15)" : "rgba(233,69,96,0.15)"}` }}>
          {!genderConstraintMet && (
            <div style={{ fontSize:12,color:"#e94560",fontWeight:600,textAlign:"center" }}>
              Roster doesn't meet {rosterMinimums?.category || ""} minimums — {genderChipLabel}
            </div>
          )}
          <div style={{ display:"flex",gap:10,justifyContent:"center",alignItems:"center" }}>
            <Btn small variant="ghost" onClick={discardRosterChanges}>Discard</Btn>
            <Btn onClick={saveDepthChart} disabled={!genderConstraintMet} style={!genderConstraintMet ? { opacity:0.5,cursor:"not-allowed" } : {}}><Icon name="save" size={14}/> Save Roster</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SURVIVOR POOL TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SurvivorPoolTab({ league, onUpdate, loggedInTeamId, isCommissioner }) {
  const team = (league.teams||[]).find(t=>t.id===loggedInTeamId);
  const activeContestants = (league.contestants||[]).filter(c=>c.status!=="eliminated").sort((a,b)=>a.name.localeCompare(b.name));
  const allContestants = (league.contestants||[]).sort((a,b)=>a.name.localeCompare(b.name));

  // Which contestants are already picked by other teams?
  const takenPicks = new Set();
  (league.teams||[]).forEach(t => { if (t.survivorPoolPick && t.id !== loggedInTeamId) takenPicks.add(t.survivorPoolPick); });

  function setPick(contestantId) {
    const updatedTeams = league.teams.map(t => t.id === loggedInTeamId ? { ...t, survivorPoolPick: contestantId || null } : t);
    onUpdate({ ...league, teams: updatedTeams });
  }

  const myPick = team?.survivorPoolPick;
  const myContestant = myPick ? allContestants.find(c=>c.id===myPick) : null;
  const isEliminated = myContestant?.status === "eliminated";
  const canChange = (league.currentWeek||1) <= 1;

  return (
    <div>
      <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em",marginBottom:16 }}>My Pick</h3>

      {myContestant ? (
        <div style={{ padding:"20px",background:isEliminated?"#1a0a10":"#0a1a18",borderRadius:14,border:isEliminated?"1px solid #e9456044":"1px solid #4ecdc444",marginBottom:16,textAlign:"center" }}>
          <div style={{margin:"0 auto 12px"}}><ContestantAvatar contestant={myContestant} league={league} size={56} /></div>
          <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:22,fontWeight:800,color:isEliminated?"#e94560":"#4ecdc4" }}>{myContestant.name}</div>
          <div style={{ fontSize:13,color:isEliminated?"#e94560":"#4ecdc4",marginTop:4 }}>
            {isEliminated ? "ELIMINATED" + (myContestant.eliminatedWeek ? " — " + cadenceLabel(league, myContestant.eliminatedWeek) : "") + " — YOU'RE OUT" : "STILL ALIVE"}
          </div>
          {canChange && <Btn small variant="ghost" onClick={()=>setPick(null)} style={{marginTop:12}}>Change Pick</Btn>}
        </div>
      ) : (
        <div>
          <div style={{ fontSize:13,color:"#6a6a8a",marginBottom:12 }}>Pick one contestant. If they get eliminated, you're out.</div>
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            {activeContestants.map(c => {
              const taken = takenPicks.has(c.id);
              return (
                <button key={c.id} onClick={()=>!taken && setPick(c.id)} disabled={taken} style={{
                  display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,
                  background:"#12121f",border:"1px solid #1e1e38",cursor:taken?"not-allowed":"pointer",
                  opacity:taken?0.4:1,textAlign:"left",fontFamily:"'Outfit',sans-serif",transition:"all .15s"
                }}>
                  <ContestantAvatar contestant={c} league={league} size={32} />
                  <div style={{ flex:1 }}>
                    <div style={{ color:"#e8e8f0",fontSize:14,fontWeight:600 }}>{c.name}</div>
                    {taken && <div style={{ fontSize:11,color:"#e94560" }}>Already picked</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* All picks overview */}
      <div style={{ marginTop:24 }}>
        <h4 style={{ fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:15,color:"#f0f0f5",marginBottom:10 }}>All Picks</h4>
        <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
          {(league.teams||[]).map(t => {
            const c = t.survivorPoolPick ? allContestants.find(x=>x.id===t.survivorPoolPick) : null;
            const elim = c?.status === "eliminated";
            return (
              <div key={t.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,background:"#12121f",border:"1px solid #1e1e38",opacity:elim?0.5:1 }}>
                <div style={{ flex:1,fontSize:13,fontWeight:600,color:"#e8e8f0" }}>{t.name}</div>
                <div style={{ fontSize:13,color:c?(elim?"#e94560":"#4ecdc4"):"#6a6a8a",fontWeight:600 }}>{c?c.name:"No pick yet"}</div>
                {elim && <Badge color="#e94560">OUT</Badge>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SALARY CAP - ROSTER TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SalaryCapRosterTab({ league, onUpdate, loggedInTeamId, isCommissioner }) {
  const team = (league.teams||[]).find(t=>t.id===loggedInTeamId);
  const prices = league.contestantPrices || {};
  const budget = league.salaryCapConfig?.budget || 100;
  const roster = team?.salaryCapRoster || [];
  const allContestants = (league.contestants||[]).filter(c=>c.status!=="eliminated").sort((a,b)=>a.name.localeCompare(b.name));
  const weeks = Object.keys(league.weeklyScores || {}).sort((a,b)=>+a - +b);

  const spent = roster.reduce((s, cid) => s + (prices[cid] || 0), 0);
  const remaining = budget - spent;

  function toggleContestant(cid) {
    let newRoster;
    if (roster.includes(cid)) {
      newRoster = roster.filter(id=>id!==cid);
    } else {
      const cost = prices[cid] || 0;
      if (cost > remaining) return; // can't afford
      newRoster = [...roster, cid];
    }
    const updatedTeams = league.teams.map(t => t.id===loggedInTeamId ? {...t, salaryCapRoster: newRoster} : t);
    onUpdate({...league, teams: updatedTeams});
  }

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>My Roster</h3>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:22,fontWeight:800,color:remaining>=0?"#4ecdc4":"#e94560" }}>${remaining}</div>
          <div style={{ fontSize:10,color:"#6a6a8a" }}>of ${budget} remaining</div>
        </div>
      </div>

      {/* Budget bar */}
      <div style={{ height:6,background:"#1e1e38",borderRadius:3,marginBottom:20,overflow:"hidden" }}>
        <div style={{ height:"100%",borderRadius:3,background:remaining>=0?"linear-gradient(90deg,#4ecdc4,#2a9d8f)":"#e94560",
          width:Math.min(100, (spent/budget)*100)+"%",transition:"width .3s" }}/>
      </div>

      {/* Current roster */}
      {roster.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11,fontWeight:700,color:"#6a6a8a",textTransform:"uppercase",marginBottom:8 }}>Your Team ({roster.length} players, ${spent} spent)</div>
          <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
            {roster.map(cid => {
              const c = (league.contestants||[]).find(x=>x.id===cid);
              if (!c) return null;
              const pts = weeks.reduce((s,w) => s + calcContestantWeekPoints(league.weeklyScores?.[w]||{}, cid), 0);
              return (
                <div key={cid} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,background:"#12121f",border:"1px solid #1e1e38" }}>
                  <ContestantAvatar contestant={c} league={league} size={28} />
                  <div style={{ flex:1,fontSize:13,fontWeight:600,color:"#e8e8f0" }}>{c.name}</div>
                  <div style={{ fontSize:12,color:"#f5a623",fontWeight:700 }}>${prices[cid]||0}</div>
                  <div style={{ fontSize:12,color:pts>0?"#4ecdc4":"#6a6a8a",fontWeight:700 }}>{pts>0?"+":""}{formatPts(pts, league)}</div>
                  <button onClick={()=>toggleContestant(cid)} style={{ background:"none",border:"none",color:"#e94560",cursor:"pointer",fontSize:12 }}>Drop</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available contestants */}
      <div style={{ fontSize:11,fontWeight:700,color:"#6a6a8a",textTransform:"uppercase",marginBottom:8 }}>Available</div>
      <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
        {allContestants.filter(c=>!roster.includes(c.id)).map(c => {
          const cost = prices[c.id] || 0;
          const canAfford = cost <= remaining;
          return (
            <button key={c.id} onClick={()=>canAfford && toggleContestant(c.id)} disabled={!canAfford} style={{
              display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,
              background:"#12121f",border:"1px solid #1e1e38",cursor:canAfford?"pointer":"not-allowed",
              opacity:canAfford?1:0.4,textAlign:"left",fontFamily:"'Outfit',sans-serif",
            }}>
              <ContestantAvatar contestant={c} league={league} size={28} />
              <div style={{ flex:1,fontSize:13,fontWeight:600,color:"#e8e8f0" }}>{c.name}</div>
              <div style={{ fontSize:13,color:"#f5a623",fontWeight:700 }}>${cost}</div>
            </button>
          );
        })}
        {Object.keys(prices).length === 0 && <EmptyState message="Commissioner hasn't set prices yet." />}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SALARY CAP - PRICES TAB (Commissioner)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function SalaryCapPricesTab({ league, onUpdate }) {
  const prices = league.contestantPrices || {};
  const budget = league.salaryCapConfig?.budget || 100;
  const contestants = (league.contestants||[]).sort((a,b)=>a.name.localeCompare(b.name));

  function setPrice(cid, price) {
    const newPrices = {...prices, [cid]: Number(price) || 0};
    onUpdate({...league, contestantPrices: newPrices});
  }

  function autoPrice() {
    // Simple auto-pricing: distribute prices roughly evenly, with some variance
    const count = contestants.length;
    if (count === 0) return;
    const avg = Math.round(budget / Math.max(count / 2, 1));
    const newPrices = {};
    contestants.forEach((c, i) => {
      // Stagger prices: first contestants cost more
      const tier = Math.floor(i / Math.ceil(count / 4));
      const price = Math.max(1, Math.round(avg * [1.8, 1.2, 0.8, 0.5][tier] || avg));
      newPrices[c.id] = price;
    });
    onUpdate({...league, contestantPrices: newPrices});
  }

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>Set Prices</h3>
        <Btn small variant="secondary" onClick={autoPrice}>Auto-Price</Btn>
      </div>
      <div style={{ fontSize:13,color:"#6a6a8a",marginBottom:16 }}>Budget per manager: <strong style={{color:"#f5a623"}}>${budget}</strong></div>

      <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
        {contestants.map(c => (
          <div key={c.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,background:"#12121f",border:"1px solid #1e1e38" }}>
            <ContestantAvatar contestant={c} league={league} size={28} />
            <div style={{ flex:1,fontSize:13,fontWeight:600,color:c.status==="eliminated"?"#6a6a8a":"#e8e8f0" }}>{c.name}{c.status==="eliminated"?" (elim)":""}</div>
            <div style={{ display:"flex",alignItems:"center",gap:4 }}>
              <span style={{ color:"#f5a623",fontSize:13 }}>$</span>
              <input type="number" min="0" max={budget} value={prices[c.id]||""} placeholder="0"
                onChange={e=>setPrice(c.id, e.target.value)}
                style={{ width:50,padding:"4px 6px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
                  color:"#f5a623",fontSize:13,fontWeight:700,textAlign:"center",fontFamily:"'Outfit',sans-serif" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ELIMINATION POOL TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function EliminationPoolTab({ league, onUpdate, loggedInTeamId, isCommissioner }) {
  const team = (league.teams||[]).find(t=>t.id===loggedInTeamId);
  const activeContestants = (league.contestants||[]).filter(c=>c.status!=="eliminated").sort((a,b)=>a.name.localeCompare(b.name));
  const allContestants = (league.contestants||[]).sort((a,b)=>a.name.localeCompare(b.name));
  const currentWeek = String(league.currentWeek || 1);

  const weeklyPicks = team?.weeklyPicks || {};
  const currentPick = weeklyPicks[currentWeek];
  const usedPicks = new Set(Object.values(weeklyPicks));

  function makePick(cid) {
    const newPicks = { ...weeklyPicks, [currentWeek]: cid };
    const updatedTeams = league.teams.map(t => t.id === loggedInTeamId ? { ...t, weeklyPicks: newPicks } : t);
    onUpdate({ ...league, teams: updatedTeams });
  }

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>{cadenceWord(league)} Pick</h3>
        <Badge color="#f5a623">{cadenceLabel(league, currentWeek)}</Badge>
      </div>
      <div style={{ fontSize:13,color:"#6a6a8a",marginBottom:16 }}>Pick one contestant you think will survive this {cadenceWord(league).toLowerCase()}. You can't reuse picks.</div>

      {currentPick ? (
        <div style={{ padding:"16px",background:"#0a1a18",borderRadius:12,border:"1px solid #4ecdc444",textAlign:"center",marginBottom:16 }}>
          <div style={{ fontSize:12,color:"#6a6a8a",marginBottom:6 }}>Your pick for {cadenceLabel(league, currentWeek)}:</div>
          <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:20,fontWeight:800,color:"#4ecdc4" }}>{allContestants.find(c=>c.id===currentPick)?.name || "Unknown"}</div>
          {!isRosterLocked(league) && <Btn small variant="ghost" onClick={()=>makePick(null)} style={{marginTop:8}}>Change</Btn>}
        </div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
          {activeContestants.filter(c=>!usedPicks.has(c.id)).map(c => (
            <button key={c.id} onClick={()=>makePick(c.id)} style={{
              display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:10,
              background:"#12121f",border:"1px solid #1e1e38",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif",
            }}>
              <ContestantAvatar contestant={c} league={league} size={32} />
              <span style={{ color:"#e8e8f0",fontSize:14,fontWeight:600 }}>{c.name}</span>
            </button>
          ))}
          {activeContestants.filter(c=>!usedPicks.has(c.id)).length === 0 && <EmptyState message="No unused contestants available." />}
        </div>
      )}

      {/* Pick history */}
      {Object.keys(weeklyPicks).length > 0 && (
        <div style={{ marginTop:20 }}>
          <h4 style={{ fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:15,color:"#f0f0f5",marginBottom:10 }}>Pick History</h4>
          <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
            {Object.entries(weeklyPicks).sort((a,b)=>+b[0]-+a[0]).map(([wk,cid]) => {
              const c = allContestants.find(x=>x.id===cid);
              const survived = !c || c.status !== "eliminated" || (c.eliminatedWeek && c.eliminatedWeek > Number(wk));
              return (
                <div key={wk} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,background:"#12121f",border:"1px solid #1e1e38" }}>
                  <Badge color="#6a6a8a">{cadenceShort(league)} {wk}</Badge>
                  <span style={{ flex:1,color:"#e8e8f0",fontSize:13,fontWeight:600 }}>{c?.name||"?"}</span>
                  <span style={{ fontSize:12,fontWeight:700,color:survived?"#4ecdc4":"#e94560" }}>{survived?"+3":"-5"}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PREDICTIONS - PLAYER TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PredictionsPlayerTab({ league, onUpdate, loggedInTeamId }) {
  const team = (league.teams||[]).find(t=>t.id===loggedInTeamId);
  const currentWeek = String(league.currentWeek || 1);
  const questions = league.weeklyQuestions?.[currentWeek] || [];
  const myAnswers = team?.weeklyAnswers?.[currentWeek] || {};

  function setAnswer(qId, answer) {
    const newAnswers = { ...(team?.weeklyAnswers||{}), [currentWeek]: { ...myAnswers, [qId]: answer } };
    const updatedTeams = league.teams.map(t => t.id === loggedInTeamId ? { ...t, weeklyAnswers: newAnswers } : t);
    onUpdate({ ...league, teams: updatedTeams });
  }

  const allContestants = (league.contestants||[]).filter(c=>c.status!=="eliminated").sort((a,b)=>a.name.localeCompare(b.name));

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>Predictions</h3>
        <Badge color="#f5a623">{cadenceLabel(league, currentWeek)}</Badge>
      </div>

      {questions.length === 0 ? (
        <EmptyState message={`No questions posted yet for this ${cadenceWord(league).toLowerCase()}. Check back before the episode!`} />
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
          {questions.map((q,qi) => (
            <div key={q.id||qi} style={{ padding:"14px 16px",background:"#12121f",borderRadius:12,border:"1px solid #1e1e38" }}>
              <div style={{ fontSize:14,fontWeight:600,color:"#e8e8f0",marginBottom:4 }}>{q.text}</div>
              <div style={{ fontSize:11,color:"#6a6a8a",marginBottom:10 }}>{q.points} pts · {q.type==="pick_one"?"Pick one":q.type==="yes_no"?"Yes or No":"Rank"}</div>

              {q.type === "pick_one" && (
                <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                  {(q.options||allContestants.map(c=>c.name)).map(opt => (
                    <button key={opt} onClick={()=>setAnswer(q.id,opt)} style={{
                      padding:"8px 14px",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600,
                      background:myAnswers[q.id]===opt?"#e9456022":"#1e1e38",
                      border:myAnswers[q.id]===opt?"1px solid #e9456066":"1px solid #2a2a4a",
                      color:myAnswers[q.id]===opt?"#e94560":"#c8c8da",fontFamily:"'Outfit',sans-serif",
                    }}>{opt}</button>
                  ))}
                </div>
              )}

              {q.type === "yes_no" && (
                <div style={{ display:"flex",gap:8 }}>
                  {["Yes","No"].map(opt => (
                    <button key={opt} onClick={()=>setAnswer(q.id,opt)} style={{
                      flex:1,padding:"10px",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:700,
                      background:myAnswers[q.id]===opt?"#e9456022":"#1e1e38",
                      border:myAnswers[q.id]===opt?"1px solid #e9456066":"1px solid #2a2a4a",
                      color:myAnswers[q.id]===opt?"#e94560":"#c8c8da",fontFamily:"'Outfit',sans-serif",
                    }}>{opt}</button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PREDICTIONS - COMMISSIONER TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PredictionsCommishTab({ league, onUpdate }) {
  const [newText, setNewText] = useState("");
  const [newType, setNewType] = useState("pick_one");
  const [newPoints, setNewPoints] = useState(5);
  const [selectedWeek, setSelectedWeek] = useState(String(league.currentWeek || 1));
  const [newOptions, setNewOptions] = useState("");

  const questions = league.weeklyQuestions?.[selectedWeek] || [];

  function addQuestion() {
    if (!newText.trim()) return;
    const q = {
      id: generateId(),
      text: newText.trim(),
      type: newType,
      points: Number(newPoints),
      options: newType === "pick_one" && newOptions.trim() ? newOptions.split(",").map(s=>s.trim()).filter(Boolean) : null,
      answer: null,
    };
    const weekQs = [...questions, q];
    const allQs = { ...(league.weeklyQuestions||{}), [selectedWeek]: weekQs };
    onUpdate({ ...league, weeklyQuestions: allQs });
    setNewText("");
    setNewOptions("");
  }

  function removeQuestion(qId) {
    const weekQs = questions.filter(q=>q.id!==qId);
    const allQs = { ...(league.weeklyQuestions||{}), [selectedWeek]: weekQs };
    onUpdate({ ...league, weeklyQuestions: allQs });
  }

  function setCorrectAnswer(qId, answer) {
    const weekQs = questions.map(q=>q.id===qId?{...q,answer}:q);
    const allQs = { ...(league.weeklyQuestions||{}), [selectedWeek]: weekQs };

    // Score all teams
    const updatedTeams = league.teams.map(t => {
      const teamAnswers = t.weeklyAnswers?.[selectedWeek] || {};
      let weekScore = 0;
      weekQs.forEach(q => {
        if (q.answer && teamAnswers[q.id] === q.answer) weekScore += q.points;
      });
      return { ...t, predictionScores: { ...(t.predictionScores||{}), [selectedWeek]: weekScore } };
    });

    onUpdate({ ...league, weeklyQuestions: allQs, teams: updatedTeams });
  }

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>Manage Questions</h3>
        <Select value={selectedWeek} onChange={e=>setSelectedWeek(e.target.value)}
          options={Array.from({length:Math.max(league.currentWeek||1,1)+2},(_,i)=>({value:String(i+1),label:cadenceLabel(league, i+1)}))} />
      </div>

      {/* Existing questions */}
      {questions.length > 0 && (
        <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:20 }}>
          {questions.map(q => (
            <div key={q.id} style={{ padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:14,fontWeight:600,color:"#e8e8f0" }}>{q.text}</div>
                  <div style={{ fontSize:11,color:"#6a6a8a",marginTop:2 }}>{q.type} · {q.points} pts{q.answer ? ` · Answer: ${q.answer}` : ""}</div>
                </div>
                <div style={{ display:"flex",gap:4 }}>
                  {!q.answer && (
                    <Btn small variant="secondary" onClick={()=>{
                      const ans = prompt("What's the correct answer?");
                      if (ans) setCorrectAnswer(q.id, ans);
                    }}>Set Answer</Btn>
                  )}
                  <Btn small variant="danger" onClick={()=>removeQuestion(q.id)}>X</Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new question */}
      <div style={{ padding:"14px 16px",background:"#0d0d18",borderRadius:12,border:"1px solid #1e1e38" }}>
        <div style={{ fontSize:13,fontWeight:700,color:"#f0f0f5",marginBottom:10 }}>Add Question</div>
        <Input label="Question" placeholder={`e.g. "Who gets eliminated this ${cadenceWord(league).toLowerCase()}?"`} value={newText} onChange={e=>setNewText(e.target.value)} />
        <div style={{ display:"flex",gap:10,marginBottom:14 }}>
          <Select label="Type" value={newType} onChange={e=>setNewType(e.target.value)} options={[
            {value:"pick_one",label:"Pick One"},{value:"yes_no",label:"Yes / No"},
          ]} />
          <Input label="Points" type="number" value={newPoints} onChange={e=>setNewPoints(e.target.value)} style={{width:80}} />
        </div>
        {newType === "pick_one" && (
          <Input label="Custom Options (comma-separated, leave blank for contestant list)" placeholder="Option A, Option B, Option C" value={newOptions} onChange={e=>setNewOptions(e.target.value)} />
        )}
        <Btn small onClick={addQuestion} disabled={!newText.trim()}>Add Question</Btn>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SETTINGS TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function EliminateRow({ contestant, league, onUpdate }) {
  const [confirming, setConfirming] = useState(false);
  const [week, setWeek] = useState(String(league.currentWeek || 1));

  if (confirming) {
    return (
      <div style={{ padding:"8px 0",borderBottom:"1px solid #1a1a30" }}>
        <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
          <span style={{ color:"#e94560",fontSize:13,fontWeight:600 }}>Eliminate {contestant.name}?</span>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:8 }}>
          <label style={{ color:"#8888aa",fontSize:12 }}>{cadenceWord(league)}:</label>
          <input type="number" min="1" value={week} onChange={e=>setWeek(e.target.value)} style={{
            width:60,padding:"5px 8px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:4,
            color:"#e8e8f0",fontSize:13,textAlign:"center",fontFamily:"'Outfit',sans-serif",
          }} />
          <Btn small variant="danger" onClick={()=>{
            onUpdate({...league,contestants:league.contestants.map(x=>x.id===contestant.id?{...x,status:"eliminated",eliminatedWeek:Number(week)||league.currentWeek}:x)});
            setConfirming(false);
          }}>Confirm</Btn>
          <Btn small variant="ghost" onClick={()=>setConfirming(false)}>Cancel</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #1a1a30" }}>
      <span style={{ color:"#ccc",fontSize:13,flex:1 }}>{contestant.name}</span>
      <Btn small variant="danger" onClick={()=>setConfirming(true)}>Eliminate</Btn>
    </div>
  );
}

function ImportXLSXSection({ league, onUpdate }) {
  const [importData, setImportData] = useState(null);
  const [importError, setImportError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");
    setImportData(null);

    try {
      const data = await file.arrayBuffer();
            const wb = XLSX.read(data, { type: "array" });
      const sheetNames = wb.SheetNames;

      const result = { scoringRules: [], contestants: [], teams: {}, weeklyScores: {}, weeklyDepthCharts: {}, tribes: {}, maxWeek: 0, sheets: sheetNames };

      // ─── 1. SCORING RULES ───
      const scoringSheet = sheetNames.find(n => n.toLowerCase() === "scoring");
      if (scoringSheet) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[scoringSheet], { header: 1 });
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row[0] && !row[1]) continue;
          const label = String(row[1] || row[0] || "").trim();
          const points = Number(row[2] ?? row[1] ?? 0);
          const category = String(row[0] || "general").trim();
          if (label) {
            result.scoringRules.push({
              id: label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/,""),
              label, points, category,
            });
          }
        }
      }

      // ─── 2. SCORING TABLE (weekly contestant scores) ───
      const scoringTableSheet = sheetNames.find(n => n.toLowerCase().includes("scoring table"));
      if (scoringTableSheet) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[scoringTableSheet], { header: 1 });
        if (rows.length > 1) {
          const header = rows[0];
          // Columns: Week, Contestant/Chef, then scoring metric columns..., Total Points
          const weekCol = 0;
          const nameCol = 1;
          // Find metric columns (skip first 2 and last "Total Points" column)
          const metricCols = [];
          for (let c = 2; c < header.length; c++) {
            const h = String(header[c] || "").trim();
            if (h.toLowerCase().includes("total points") || h === "") continue;
            // Match to scoring rule
            const ruleId = h.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/,"");
            metricCols.push({ col: c, header: h, ruleId });
          }

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const week = String(Math.round(Number(row[weekCol] || 0)));
            const name = String(row[nameCol] || "").trim();
            if (!name || week === "0") continue;

            const wk = Number(week);
            if (wk > result.maxWeek) result.maxWeek = wk;

            if (!result.weeklyScores[week]) result.weeklyScores[week] = {};

            // Find or create contestant ID
            const cId = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/,"");

            // Add contestant to set
            if (!result.contestants.find(c => c.id === cId)) {
              result.contestants.push({ id: cId, name, status: "active" });
            }

            const contestantScores = {};
            for (const mc of metricCols) {
              const val = Number(row[mc.col] || 0);
              if (val !== 0) {
                // Store as the raw count * points_per (matching the app's format)
                const rule = result.scoringRules.find(r => r.id === mc.ruleId);
                if (rule) {
                  contestantScores[mc.ruleId] = Math.round(val * rule.points * 100) / 100;
                } else {
                  contestantScores[mc.ruleId] = val;
                }
              }
            }
            if (Object.keys(contestantScores).length > 0) {
              result.weeklyScores[week][cId] = contestantScores;
            }
          }
        }
      }

      // ─── 3. TEAMS (weekly depth charts) ───
      const teamsSheet = sheetNames.find(n => n.toLowerCase() === "teams");
      if (teamsSheet) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[teamsSheet], { header: 1 });
        if (rows.length > 1) {
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const week = String(Math.round(Number(row[0] || 0)));
            const owner = String(row[1] || "").trim();
            const captain = String(row[2] || "").trim();
            const coCaptain = String(row[3] || "").trim();
            const regs = [];
            for (let c = 4; c <= 6; c++) {
              const r = String(row[c] || "").trim();
              if (r) regs.push(r);
            }
            if (!owner || week === "0") continue;

            const wk = Number(week);
            if (wk > result.maxWeek) result.maxWeek = wk;

            if (!result.teams[owner]) result.teams[owner] = { weeklyCharts: {} };

            // Convert names to IDs
            const findId = (name) => {
              if (!name) return null;
              const c = result.contestants.find(x => x.name.toLowerCase() === name.toLowerCase());
              return c ? c.id : name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/,"");
            };

            result.teams[owner].weeklyCharts[week] = {
              captain: findId(captain),
              coCaptain: findId(coCaptain),
              regulars: regs.map(r => findId(r)).filter(Boolean),
            };
          }
        }
      }

      // ─── 4. CONTESTANTS (status, tribes) ───
      const contestantsSheet = sheetNames.find(n => n.toLowerCase().includes("contestant"));
      if (contestantsSheet) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[contestantsSheet], { header: 1 });
        if (rows.length > 1) {
          const header = rows[0].map(h => String(h || "").trim().toLowerCase());
          const nameCol = header.findIndex(h => h === "contestant" || h === "name" || h === "chef");
          const activeCol = header.findIndex(h => h === "active" || h === "status");
          const elimWeekCol = header.findIndex(h => h.includes("eliminated") && h.includes("week"));

          // Find tribe columns
          const tribeStartCol = header.findIndex(h => h === "tribes" || h === "tribe");

          if (nameCol >= 0) {
            for (let i = 1; i < rows.length; i++) {
              const row = rows[i];
              const name = String(row[nameCol] || "").trim();
              if (!name) continue;
              const isActive = activeCol >= 0 ? (row[activeCol] === true || String(row[activeCol]).toLowerCase() === "true") : true;
              const elimWeek = elimWeekCol >= 0 && row[elimWeekCol] ? Number(row[elimWeekCol]) : null;

              const existing = result.contestants.find(c => c.name.toLowerCase() === name.toLowerCase());
              if (existing) {
                existing.status = isActive ? "active" : "eliminated";
                if (elimWeek) existing.eliminatedWeek = elimWeek;
              } else {
                const cId = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/,"");
                result.contestants.push({ id: cId, name, status: isActive ? "active" : "eliminated", eliminatedWeek: elimWeek });
              }
            }
          }

          // Parse tribes
          if (tribeStartCol >= 0) {
            for (let col = tribeStartCol; col < rows[0].length && col < tribeStartCol + 10; col++) {
              const tribeName = String(rows[0][col] || "").trim();
              if (!tribeName || tribeName.toLowerCase() === "tribes") continue;
              const members = [];
              for (let r = 1; r < rows.length; r++) {
                const member = String(rows[r]?.[col] || "").trim();
                if (member) {
                  const c = result.contestants.find(x => x.name.toLowerCase().startsWith(member.toLowerCase()));
                  if (c) { members.push(c.id); c.tribe = tribeName; }
                }
              }
              if (members.length > 0) result.tribes[tribeName] = members;
            }
          }
        }
      }

      setImportData(result);
    } catch (err) {
      setImportError("Failed to parse file: " + err.message);
    }
    // Reset file input
    e.target.value = "";
  }

  function applyImport() {
    if (!importData) return;
    const d = importData;
    const updated = { ...league };

    // Scoring rules
    if (d.scoringRules.length > 0) {
      updated.scoringRules = d.scoringRules;
    }

    // Contestants (merge — keep bios from existing)
    const existingMap = {};
    (league.contestants || []).forEach(c => { existingMap[c.name.toLowerCase()] = c; });

    updated.contestants = d.contestants.map(imp => {
      const existing = existingMap[imp.name.toLowerCase()];
      return {
        id: imp.id,
        name: imp.name,
        bio: existing?.bio || "",
        gender: existing?.gender || "",
        status: imp.status,
        eliminatedWeek: imp.eliminatedWeek || null,
        tribe: imp.tribe || existing?.tribe || null,
      };
    });

    // Weekly scores
    if (Object.keys(d.weeklyScores).length > 0) {
      updated.weeklyScores = d.weeklyScores;
    }

    // Teams & depth charts
    if (Object.keys(d.teams).length > 0) {
      const teamsList = Object.entries(d.teams).map(([owner, data]) => {
        const existing = (league.teams || []).find(t => t.owner.toLowerCase() === owner.toLowerCase());
        const latestWeek = Object.keys(data.weeklyCharts).sort((a,b)=>+b-+a)[0];
        return {
          id: existing?.id || owner.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
          name: existing?.name || `Team ${owner}`,
          owner,
          depthChart: data.weeklyCharts[latestWeek] || { captain: null, coCaptain: null, regulars: [] },
          weeklyRosters: existing?.weeklyRosters || {},
          weeklyDepthCharts: data.weeklyCharts,
        };
      });
      updated.teams = teamsList;
    }

    // Tribes
    if (Object.keys(d.tribes).length > 0) {
      updated.tribes = d.tribes;
    }

    // Current week
    if (d.maxWeek > 0) {
      updated.currentWeek = d.maxWeek;
    }

    onUpdate(updated);
    setImportData(null);
  }

  const d = importData;

  return (
    <div style={{ marginBottom:20,padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
      <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:4 }}>Import from XLSX</div>
      <div style={{ fontSize:12,color:"#6a6a8a",marginBottom:10,lineHeight:1.4 }}>
        Upload your league spreadsheet. Reads: Scoring rules, Scoring Table (per-{cadenceWord(league).toLowerCase()} scores), Teams (depth charts), Contestants (status, tribes). Existing bios are preserved.
      </div>
      <input type="file" accept=".xlsx,.xls" onChange={handleFile}
        style={{ fontSize:12,color:"#8888aa",marginBottom:8,display:"block" }} />

      {importError && <div style={{ color:"#e94560",fontSize:12,marginTop:8 }}>{importError}</div>}

      {d && (
        <div style={{ marginTop:12 }}>
          <div style={{ fontSize:13,fontWeight:700,color:"#4ecdc4",marginBottom:10 }}>Import Preview</div>
          <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:12 }}>
            {d.scoringRules.length > 0 && <Badge color="#4ecdc4">{d.scoringRules.length} scoring rules</Badge>}
            {d.contestants.length > 0 && <Badge color="#4ecdc4">{d.contestants.length} contestants</Badge>}
            {Object.keys(d.teams).length > 0 && <Badge color="#4ecdc4">{Object.keys(d.teams).length} teams</Badge>}
            {Object.keys(d.weeklyScores).length > 0 && <Badge color="#f5a623">{Object.keys(d.weeklyScores).length} {cadenceWord(league).toLowerCase()}s of scores</Badge>}
            {Object.keys(d.tribes).length > 0 && <Badge color="#c44bbe">{Object.keys(d.tribes).length} tribes</Badge>}
            {d.maxWeek > 0 && <Badge color="#6a6a8a">Through {cadenceShort(league).toLowerCase()} {d.maxWeek}</Badge>}
          </div>

          {d.contestants.length > 0 && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11,fontWeight:600,color:"#6a6a8a",marginBottom:4 }}>Contestants</div>
              <div style={{ maxHeight:120,overflow:"auto",background:"#0d0d18",borderRadius:6,padding:8,fontSize:11 }}>
                {d.contestants.map((c,i) => (
                  <span key={i} style={{ color:c.status==="eliminated"?"#6a6a8a":"#ccc",marginRight:8 }}>
                    {c.name}{c.status==="eliminated"?" ✕":""}
                  </span>
                ))}
              </div>
            </div>
          )}

          {Object.keys(d.teams).length > 0 && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11,fontWeight:600,color:"#6a6a8a",marginBottom:4 }}>Teams</div>
              <div style={{ fontSize:11,color:"#8888aa" }}>{Object.keys(d.teams).join(", ")}</div>
            </div>
          )}

          <div style={{ padding:"8px 12px",background:"#f5a62311",borderRadius:6,border:"1px solid #f5a62333",marginBottom:12 }}>
            <div style={{ fontSize:11,color:"#f5a623",lineHeight:1.4 }}>
              This will replace scoring rules, per-{cadenceWord(league).toLowerCase()} scores, teams, and contestant status. Existing bios will be preserved. This cannot be undone.
            </div>
          </div>

          <div style={{ display:"flex",gap:8 }}>
            <Btn small onClick={applyImport}>Apply Import</Btn>
            <Btn small variant="ghost" onClick={()=>setImportData(null)}>Cancel</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function LinkedScoringSection({ league, allLeagues, onUpdate }) {
  const [pendingLink, setPendingLink] = useState(null);
  const [confirmText, setConfirmText] = useState("");

  const hasScores = Object.keys(league.weeklyScores || {}).length > 0;

  function handleLinkChange(targetId) {
    if (!targetId) {
      // Unlinking — just remove the link, don't touch data
      onUpdate({...league, linkedLeagueId: null});
      return;
    }
    const target = (allLeagues||[]).find(l=>l.id===targetId);
    if (!target) return;

    // If this league has its own scores, warn heavily
    if (hasScores) {
      setPendingLink(target);
      setConfirmText("");
    } else {
      onUpdate({...league, linkedLeagueId: targetId});
    }
  }

  function confirmLink() {
    if (!pendingLink) return;
    // Backup current scores before linking
    const backup = { weeklyScores: league.weeklyScores, currentWeek: league.currentWeek, backedUpAt: Date.now() };
    onUpdate({...league, linkedLeagueId: pendingLink.id, weeklyScores_backup: backup});
    setPendingLink(null);
    setConfirmText("");
  }

  return (
    <div style={{ marginBottom:20,padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
      <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:4 }}>Linked Scoring</div>
      <div style={{ fontSize:12,color:"#6a6a8a",marginBottom:8,lineHeight:1.4 }}>
        Link this league to another so scoring syncs automatically. Score once, both leagues update.
      </div>

      {!pendingLink ? (
        <>
          <select value={league.linkedLeagueId||""} onChange={e=>handleLinkChange(e.target.value)} style={{
            width:"100%",padding:"8px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",
            borderRadius:6,color:"#e8e8f0",fontSize:13,fontFamily:"'Outfit',sans-serif",
          }}>
            <option value="">— No linked league —</option>
            {(allLeagues||[]).filter(l=>l.id!==league.id).map(l=>(
              <option key={l.id} value={l.id}>{l.name} ({l.seasonName})</option>
            ))}
          </select>
          {league.linkedLeagueId && (()=>{
            const linked = (allLeagues||[]).find(l=>l.id===league.linkedLeagueId);
            return linked ? (
              <div style={{ marginTop:8,padding:"8px 12px",background:"#4ecdc411",borderRadius:6,border:"1px solid #4ecdc433" }}>
                <div style={{ fontSize:12,color:"#4ecdc4" }}>Linked to: {linked.name} ({linked.seasonName})</div>
                <div style={{ fontSize:10,color:"#6a6a8a",marginTop:4 }}>Scoring, eliminations, and {cadenceWord(league).toLowerCase()} advances sync both ways.</div>
                <Btn small variant="ghost" style={{marginTop:6}} onClick={()=>onUpdate({...league, linkedLeagueId: null})}>Unlink</Btn>
              </div>
            ) : null;
          })()}
          {league.weeklyScores_backup && (
            <div style={{ marginTop:8,padding:"8px 12px",background:"#f5a62311",borderRadius:6,border:"1px solid #f5a62333" }}>
              <div style={{ fontSize:11,color:"#f5a623" }}>A scoring backup exists from before linking.</div>
              <Btn small variant="ghost" style={{marginTop:4}} onClick={()=>{
                if(confirm("Restore scoring data from before this league was linked? This will overwrite current scores.")) {
                  const backup = league.weeklyScores_backup;
                  onUpdate({...league, weeklyScores: backup.weeklyScores, currentWeek: backup.currentWeek, weeklyScores_backup: null, linkedLeagueId: null});
                }
              }}>Restore Backup</Btn>
            </div>
          )}
        </>
      ) : (
        <div style={{ padding:"14px",background:"#e9456011",borderRadius:8,border:"1px solid #e9456033" }}>
          <div style={{ fontSize:13,fontWeight:700,color:"#e94560",marginBottom:8 }}>⚠️ This league already has scoring data</div>
          <div style={{ fontSize:12,color:"#e8e8f0",marginBottom:6,lineHeight:1.5 }}>
            Linking to <strong>{pendingLink.name}</strong> will sync scoring data between both leagues. Your current scores will be backed up automatically, but the active data may be overwritten.
          </div>
          <div style={{ fontSize:12,color:"#6a6a8a",marginBottom:10 }}>
            Type <strong>{league.name}</strong> to confirm:
          </div>
          <input value={confirmText} onChange={e=>setConfirmText(e.target.value)} placeholder={league.name}
            style={{ width:"100%",padding:"8px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",
              borderRadius:6,color:"#e8e8f0",fontSize:13,fontFamily:"'Outfit',sans-serif",marginBottom:10 }} />
          <div style={{ display:"flex",gap:8 }}>
            <Btn small variant="danger" disabled={confirmText !== league.name} onClick={confirmLink}>Confirm Link</Btn>
            <Btn small variant="ghost" onClick={()=>{setPendingLink(null);setConfirmText("")}}>Cancel</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FINAL LOCK-IN — Commissioner panel (Heroes only)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function FinalLockInCommishPanel({ league, onUpdate }) {
  const status = getLockInStatus(league);
  const teams = league.teams || [];

  function openLockIn() {
    if (!confirm("Open Final Lock-In?\n\nEach team will pick their final roster for the rest of the season. Once a team confirms, they can only edit their depth chart — no more contestant swaps. This cannot be undone.")) return;
    onUpdate({
      ...league,
      lockInStatus: "open",
      lockInOpenedWeek: league.currentWeek || 1,
      lockInOpenedAt: Date.now(),
    });
  }

  function forceClose() {
    if (!confirm("Force-close lock-in?\n\nAny team that hasn't confirmed will have their CURRENT depth-chart roster locked in automatically.")) return;
    const updatedTeams = teams.map(team => {
      if (!team.lockedRoster || team.lockedRoster.length === 0) {
        const chart = team.depthChart || { captain: null, coCaptain: null, regulars: [] };
        const current = [chart.captain, chart.coCaptain, ...(chart.regulars || [])].filter(Boolean);
        return { ...team, lockedRoster: current, lockInConfirmedAt: Date.now() };
      }
      return team;
    });
    onUpdate({ ...league, teams: updatedTeams, lockInStatus: "locked" });
  }

  function reopenLockIn() {
    if (!confirm("Reopen Final Lock-In?\n\nThis reverts lock-in to OPEN so teams can re-pick their final rosters. All existing confirmed lockedRosters will be cleared.")) return;
    const updatedTeams = teams.map(t => ({ ...t, lockedRoster: null, lockInConfirmedAt: null }));
    onUpdate({ ...league, teams: updatedTeams, lockInStatus: "open", lockInOpenedAt: Date.now() });
  }

  function cancelLockIn() {
    if (!confirm(`Cancel Final Lock-In entirely?\n\nThis closes lock-in and clears ALL locked rosters on every team. Normal ${effectiveEpisodesPerWeek(league) > 1 ? "per-episode" : "weekly"} swapping resumes.`)) return;
    const updatedTeams = teams.map(t => ({ ...t, lockedRoster: null, lockInConfirmedAt: null }));
    onUpdate({ ...league, teams: updatedTeams, lockInStatus: "closed", lockInOpenedWeek: null, lockInOpenedAt: null });
  }

  function resetTeam(teamId) {
    const t = teams.find(x => x.id === teamId);
    if (!t) return;
    if (!confirm(`Reset ${t.name}'s lock-in? They'll be able to re-pick their final roster.`)) return;
    const updatedTeams = teams.map(x => x.id === teamId ? { ...x, lockedRoster: null, lockInConfirmedAt: null } : x);
    // If league was fully locked, drop it back to open so this team can re-pick.
    const newStatus = status === "locked" ? "open" : status;
    onUpdate({ ...league, teams: updatedTeams, lockInStatus: newStatus });
  }

  if (status === "closed") {
    return (
      <div style={{ marginBottom:20,padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
        <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",display:"flex",alignItems:"center",gap:6 }}>🔒 Final Lock-In</div>
        <div style={{ fontSize:12,color:"#6a6a8a",marginTop:4,marginBottom:10,lineHeight:1.4 }}>
          End-of-season mechanic. Each team picks their final roster and can no longer swap contestants — only adjust their depth chart. Use this when the contestant pool shrinks to create variance.
        </div>
        <Btn small variant="secondary" onClick={openLockIn}>Open Final Lock-In</Btn>
      </div>
    );
  }

  return (
    <div style={{ marginBottom:20,padding:"16px",background:"#f5a62311",borderRadius:10,border:"1px solid #f5a62333" }}>
      <div style={{ fontSize:14,fontWeight:700,color:"#f5a623",display:"flex",alignItems:"center",gap:6 }}>
        🔒 Final Lock-In: {status === "locked" ? "LOCKED" : "OPEN"}{league.lockInOpenedWeek ? ` (since ${cadenceLabel(league, league.lockInOpenedWeek)})` : ""}
      </div>
      <div style={{ marginTop:10,display:"flex",flexDirection:"column",gap:4 }}>
        {teams.map(t => {
          const confirmed = t.lockedRoster && t.lockedRoster.length > 0;
          return (
            <div key={t.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1a1a30",fontSize:12,gap:8 }}>
              <span style={{ color:"#e8e8f0",flex:1 }}>
                {confirmed ? "✅" : "⏳"} {t.name}
              </span>
              <span style={{ color:confirmed?"#4ecdc4":"#6a6a8a",fontSize:11 }}>
                {confirmed ? "confirmed" : "pending"}
              </span>
              {confirmed && (
                <Btn small variant="ghost" onClick={()=>resetTeam(t.id)}>Reset</Btn>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop:10,display:"flex",gap:8,flexWrap:"wrap" }}>
        {status === "open" && (
          <Btn small variant="danger" onClick={forceClose}>Force Close Lock-In</Btn>
        )}
        {status === "locked" && (
          <Btn small variant="secondary" onClick={reopenLockIn}>Reopen Lock-In</Btn>
        )}
        <Btn small variant="ghost" onClick={cancelLockIn}>Cancel Lock-In</Btn>
      </div>
    </div>
  );
}

function SpoilerProtectionEditor({ league, onUpdate }) {
  const [hours, setHours] = useState(league.spoilerGracePeriod || 48);
  const hasChanges = hours !== (league.spoilerGracePeriod || 48);
  return (
    <div style={{ padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
      <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:8 }}>Spoiler Protection</div>
      <div style={{ fontSize:12,color:"#6a6a8a",marginBottom:10,lineHeight:1.4 }}>
        After you finalize {effectiveEpisodesPerWeek(league) > 1 ? "an episode's" : "a week's"} scores, members won't see results until they choose to reveal them or the grace period expires.
      </div>
      <Input label="Grace Period (hours)" type="number" value={hours}
        onChange={e => setHours(Number(e.target.value) || 48)} />
      {hasChanges && (
        <div style={{ display:"flex",gap:8,marginTop:10 }}>
          <Btn small onClick={()=>onUpdate({...league, spoilerGracePeriod: hours})}>Save</Btn>
          <Btn small variant="ghost" onClick={()=>setHours(league.spoilerGracePeriod || 48)}>Cancel</Btn>
        </div>
      )}
    </div>
  );
}

// Walks weeklyScores and rewrites every entry for `ruleId` using newPts.
// Stored value is `count * rulePoints` (see setScore in WeeklyScoringTab),
// so count is recovered by `Math.round(stored / oldPts)` and re-multiplied.
function recalcWeeklyScoresForRulePointsChange(league, ruleId, oldPts, newPts) {
  if (oldPts === newPts) return league;
  const ws = league.weeklyScores || {};
  const out = {};
  for (const w in ws) {
    out[w] = {};
    for (const cid in ws[w]) {
      const cs = ws[w][cid] || {};
      const nextCs = { ...cs };
      if (ruleId in cs) {
        const stored = cs[ruleId];
        const count = (!oldPts || oldPts === 0) ? 0 : Math.round(stored / oldPts);
        nextCs[ruleId] = count * newPts;
      }
      out[w][cid] = nextCs;
    }
  }
  return { ...league, weeklyScores: out };
}

function recalcWeeklyScoresForRuleRemoval(league, ruleId) {
  const ws = league.weeklyScores || {};
  const out = {};
  for (const w in ws) {
    out[w] = {};
    for (const cid in ws[w]) {
      const cs = ws[w][cid] || {};
      const nextCs = { ...cs };
      delete nextCs[ruleId];
      out[w][cid] = nextCs;
    }
  }
  return { ...league, weeklyScores: out };
}

function ScoringRulesSection({ league, onUpdate, userProfile }) {
  const rules = league.scoringRules || [];
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newPoints, setNewPoints] = useState(0);
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  // v2.4.45.0: library was showing all 133 default rules across every show
  // preset — Survivor commissioners saw Top Chef / Bake Off / Drag Race
  // entries cluttering the picker. Default the filter to this league's show
  // (so Survivor sees only Survivor rules), with a dropdown to switch to a
  // different show or "All shows" for the rare cross-show borrow case.
  const [libraryShow, setLibraryShow] = useState(league.showType || "all");

  // Group rules by category, preserving the order they appear in the league array
  const grouped = useMemo(() => {
    const g = {};
    const order = [];
    rules.forEach(r => {
      const cat = r.category || "Other";
      if (!g[cat]) { g[cat] = []; order.push(cat); }
      g[cat].push(r);
    });
    return { g, order };
  }, [rules]);

  const existingIds = new Set(rules.map(r => r.id));
  // Filter the library by show: when libraryShow points at a known preset,
  // intersect against its scoringDefaults list of rule IDs; "all" returns
  // every default rule. Already-added rules are still excluded.
  const libraryAvailable = useMemo(() => {
    const showIds = libraryShow !== "all" ? new Set(SHOW_PRESETS[libraryShow]?.scoringDefaults || []) : null;
    return DEFAULT_SCORING_RULES.filter(r => !existingIds.has(r.id) && (!showIds || showIds.has(r.id)));
  }, [libraryShow, existingIds]);

  function updateRulePoints(ruleId, nextPts) {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;
    const oldPts = Number(rule.points) || 0;
    const newPts = Number(nextPts);
    if (Number.isNaN(newPts) || newPts === oldPts) return;
    const nextRules = rules.map(r => r.id === ruleId ? { ...r, points: newPts } : r);
    const recalced = recalcWeeklyScoresForRulePointsChange(league, ruleId, oldPts, newPts);
    // v2.6.2.0: audit-log scoring metric adjustments — point changes are
    // material (affect every past score). Label / category / description
    // edits are cosmetic and intentionally skipped.
    const actorName = userProfile?.displayName || "Commissioner";
    const audited = appendAudit(recalced, {
      type: "scoring-rule",
      actorName,
      desc: `${actorName} changed "${rule.label}" from ${oldPts>=0?"+":""}${oldPts} to ${newPts>=0?"+":""}${newPts} pts`,
      meta: { ruleId, oldPts, newPts },
    });
    onUpdate({ ...audited, scoringRules: nextRules });
  }

  function updateRuleLabel(ruleId, label) {
    onUpdate({ ...league, scoringRules: rules.map(r => r.id === ruleId ? { ...r, label } : r) });
  }

  function updateRuleCategory(ruleId, category) {
    onUpdate({ ...league, scoringRules: rules.map(r => r.id === ruleId ? { ...r, category } : r) });
  }

  function updateRuleDescription(ruleId, description) {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;
    if ((rule.description || "") === (description || "")) return; // no-op guard
    const nextRules = rules.map(r => r.id === ruleId ? { ...r, description } : r);
    // v2.6.3.0: description changes ARE meaningful — they change what the rule
    // counts (e.g. "first kiss between coupled people" vs "first kiss between
    // any two individuals"), which affects how the commissioner scores. Log it.
    const actorName = userProfile?.displayName || "Commissioner";
    const audited = appendAudit(league, {
      type: "scoring-rule",
      actorName,
      desc: `${actorName} updated description for "${rule.label}"`,
      meta: { ruleId },
    });
    onUpdate({ ...audited, scoringRules: nextRules });
  }

  function removeRule(ruleId) {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;
    if (!confirm(`Remove "${rule.label}"? Any points already scored for this rule will be erased from past weeks.`)) return;
    const recalced = recalcWeeklyScoresForRuleRemoval(league, ruleId);
    const actorName = userProfile?.displayName || "Commissioner";
    const audited = appendAudit(recalced, {
      type: "scoring-rule",
      actorName,
      desc: `${actorName} removed scoring rule "${rule.label}"`,
      meta: { ruleId },
    });
    onUpdate({ ...audited, scoringRules: rules.filter(r => r.id !== ruleId) });
  }

  function addCustomRule() {
    const label = newLabel.trim();
    if (!label) return;
    const baseId = "custom_" + label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, "");
    let id = baseId; let n = 2;
    while (existingIds.has(id)) { id = `${baseId}_${n++}`; }
    const desc = newDescription.trim();
    const pts = Number(newPoints) || 0;
    const rule = {
      id, label, points: pts,
      category: newCategory.trim() || "Custom",
      ...(desc ? { description: desc } : {}),
    };
    const actorName = userProfile?.displayName || "Commissioner";
    const audited = appendAudit(league, {
      type: "scoring-rule",
      actorName,
      desc: `${actorName} added scoring rule "${label}" (${pts>=0?"+":""}${pts} pts)`,
      meta: { ruleId: id, points: pts },
    });
    onUpdate({ ...audited, scoringRules: [...rules, rule] });
    setNewLabel(""); setNewPoints(0); setNewCategory(""); setNewDescription(""); setAdding(false);
  }

  function addFromLibrary(rule) {
    if (existingIds.has(rule.id)) return;
    const actorName = userProfile?.displayName || "Commissioner";
    const audited = appendAudit(league, {
      type: "scoring-rule",
      actorName,
      desc: `${actorName} added scoring rule "${rule.label}" (${rule.points>=0?"+":""}${rule.points} pts) from library`,
      meta: { ruleId: rule.id, points: rule.points },
    });
    onUpdate({ ...audited, scoringRules: [...rules, { ...rule }] });
  }

  return (
    <div>
      <div style={{ marginBottom:16,padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",fontSize:12,color:"#8888aa",lineHeight:1.5 }}>
        Edit, add, or remove scoring rules for this league. Changing a rule's points will recompute past weekly scores using the same count. Removing a rule erases its entries from every past week.
      </div>

      {grouped.order.length === 0 && (
        <div style={{ padding:"20px",textAlign:"center",color:"#6a6a8a",fontSize:13,background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",marginBottom:16 }}>
          No scoring rules yet. Add one below or pick from the library.
        </div>
      )}

      {grouped.order.map(cat => (
        <div key={cat} style={{ marginBottom:16,padding:"14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
          <div style={{ fontSize:12,fontWeight:700,color:"#e8e8f0",marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em" }}>{cat}</div>
          {grouped.g[cat].map(rule => (
            <div key={rule.id} style={{ padding:"8px 0",borderBottom:"1px solid #1a1a30" }}>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <input value={rule.label} onChange={e=>updateRuleLabel(rule.id, e.target.value)} style={{
                  flex:1,padding:"6px 10px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
                  color:"#e8e8f0",fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none",minWidth:0,
                }} />
                <input value={rule.category || ""} onChange={e=>updateRuleCategory(rule.id, e.target.value)} placeholder="Category" style={{
                  width:110,padding:"6px 10px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
                  color:"#8888aa",fontSize:11,fontFamily:"'Outfit',sans-serif",outline:"none",
                }} />
                <input type="number" value={rule.points} step="0.5" onChange={e=>updateRulePoints(rule.id, e.target.value)} style={{
                  width:70,padding:"6px 10px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
                  color:rule.points>=0?"#4ecdc4":"#e94560",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",outline:"none",textAlign:"right",
                }} />
                <button onClick={()=>removeRule(rule.id)} title="Remove rule" style={{
                  background:"none",border:"1px solid #2a2a4a",borderRadius:6,color:"#e94560",
                  width:28,height:28,cursor:"pointer",fontSize:14,flexShrink:0,
                }}>×</button>
              </div>
              <textarea value={rule.description || ""} onChange={e=>updateRuleDescription(rule.id, e.target.value)} placeholder="Description (what this rule actually counts — shown to players in the Scoring tab)" rows={2} style={{
                width:"100%",marginTop:6,padding:"6px 10px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
                color:"#aaaabf",fontSize:11,fontFamily:"'Outfit',sans-serif",outline:"none",resize:"vertical",boxSizing:"border-box",lineHeight:1.4,
              }} />
            </div>
          ))}
        </div>
      ))}

      <div style={{ marginBottom:16,padding:"14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:adding?12:0 }}>
          <div style={{ fontSize:13,fontWeight:700,color:"#e8e8f0" }}>Add Custom Rule</div>
          <Btn small variant={adding?"ghost":"secondary"} onClick={()=>setAdding(!adding)}>{adding?"Cancel":"+ New"}</Btn>
        </div>
        {adding && (
          <div>
            <Input label="Label" placeholder="e.g. Kissed by the Bombshell" value={newLabel} onChange={e=>setNewLabel(e.target.value)} />
            <div style={{ display:"flex",gap:10 }}>
              <div style={{ flex:1 }}>
                <Input label="Points" type="number" step="0.5" value={newPoints} onChange={e=>setNewPoints(e.target.value)} />
              </div>
              <div style={{ flex:1 }}>
                <Input label="Category" placeholder="e.g. Moments" value={newCategory} onChange={e=>setNewCategory(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11,fontWeight:600,color:"#8888aa",marginBottom:4 }}>Description <span style={{ color:"#5a5a7a",fontWeight:400 }}>(what this rule counts — shown to players)</span></div>
              <textarea value={newDescription} onChange={e=>setNewDescription(e.target.value)} placeholder="e.g. Kissed another contestant on a date or in private moments shown on camera." rows={2} style={{
                width:"100%",padding:"8px 10px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
                color:"#e8e8f0",fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none",resize:"vertical",boxSizing:"border-box",lineHeight:1.4,
              }} />
            </div>
            <Btn small onClick={addCustomRule} disabled={!newLabel.trim()}>Add Rule</Btn>
          </div>
        )}
      </div>

      <div style={{ marginBottom:20,padding:"14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:pickerOpen?12:0,flexWrap:"wrap" }}>
          <div style={{ fontSize:13,fontWeight:700,color:"#e8e8f0" }}>Add from Library ({libraryAvailable.length} available)</div>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            <select value={libraryShow} onChange={e=>setLibraryShow(e.target.value)} title="Filter library by show" style={{
              padding:"6px 10px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
              color:"#e8e8f0",fontSize:12,fontFamily:"'Outfit',sans-serif",cursor:"pointer",outline:"none",
            }}>
              {Object.entries(SHOW_PRESETS).map(([id, p]) => (
                <option key={id} value={id}>{p.name}</option>
              ))}
              <option value="all">All shows</option>
            </select>
            <Btn small variant={pickerOpen?"ghost":"secondary"} onClick={()=>setPickerOpen(!pickerOpen)} disabled={libraryAvailable.length===0}>{pickerOpen?"Close":"Browse"}</Btn>
          </div>
        </div>
        {pickerOpen && libraryAvailable.length > 0 && (
          <div style={{ maxHeight:300,overflow:"auto",background:"#0d0d18",borderRadius:6,padding:8 }}>
            {libraryAvailable.map(rule => (
              <div key={rule.id} style={{ display:"flex",alignItems:"flex-start",gap:8,padding:"8px 4px",borderBottom:"1px solid #1a1a30" }}>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ color:"#e8e8f0",fontSize:12,fontWeight:600 }}>{rule.label}</div>
                  <div style={{ color:"#6a6a8a",fontSize:10,marginTop:2 }}>{rule.category || "Other"}</div>
                  {rule.description && (
                    <div style={{ color:"#8888aa",fontSize:10,marginTop:4,lineHeight:1.4 }}>{rule.description}</div>
                  )}
                </div>
                <div style={{ width:50,textAlign:"right",fontSize:12,fontWeight:700,color:rule.points>=0?"#4ecdc4":"#e94560",paddingTop:1 }}>{rule.points>=0?"+":""}{rule.points}</div>
                <button onClick={()=>addFromLibrary(rule)} style={{
                  background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:6,color:"#4ecdc4",
                  padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:600,
                }}>Add</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// v2.4.50.0: Generalized category-minimums editor. Replaces the old gender-
// only inputs in SettingsTab. Lets commissioners pick a category (gender or
// tribe) and set a minimum count per value. When no minimums are active, the
// checkbox is unchecked. Migrates the legacy {genderedRoster, minMale,
// minFemale} schema into the new shape on first toggle so old leagues keep
// working without a separate migration step.
function CategoryMinimumsEditor({ league, onUpdate }) {
  const cfg = league.captainsConfig || {};
  const totalSlots = (Number(cfg.regularSlots)||3) + 2;
  const active = getRosterMinimums(league);
  const category = active?.category || cfg.minCategory || "gender";
  const minimums = active?.minimums || {};

  // Available values for each category. Gender is fixed; tribe is read live
  // from league.tribes so adding a new tribe automatically extends the list.
  const tribeNames = Object.keys(league.tribes || {});
  const valueOptions = category === "tribe" ? tribeNames : ["Male", "Female"];

  function setEnabled(enabled) {
    if (!enabled) {
      // Disable entirely — write back to a clean state. Keep minCategory so
      // turning it back on remembers the last category selection.
      onUpdate({ ...league, captainsConfig: { ...cfg, genderedRoster: false, minCategory: cfg.minCategory || category, minimums: {} } });
      return;
    }
    // Enable with a sensible default for the chosen category.
    const defaults = category === "gender" ? { Male: 2, Female: 2 } : Object.fromEntries(valueOptions.slice(0, 3).map(v => [v, 1]));
    onUpdate({ ...league, captainsConfig: { ...cfg, genderedRoster: false, minCategory: category, minimums: { ...minimums, ...defaults } } });
  }

  function setCategory(nextCategory) {
    const nextValues = nextCategory === "tribe" ? tribeNames : ["Male", "Female"];
    const defaults = nextCategory === "gender" ? { Male: 2, Female: 2 } : Object.fromEntries(nextValues.slice(0, 3).map(v => [v, 1]));
    onUpdate({ ...league, captainsConfig: { ...cfg, genderedRoster: false, minCategory: nextCategory, minimums: defaults } });
  }

  function setMinimum(value, n) {
    const next = { ...minimums, [value]: Number(n) || 0 };
    onUpdate({ ...league, captainsConfig: { ...cfg, genderedRoster: false, minCategory: category, minimums: next } });
  }

  const total = Object.values(minimums).reduce((s, v) => s + (Number(v) || 0), 0);
  const exceeds = total > totalSlots;
  const isEnabled = !!active;

  return (
    <div style={{ marginTop:12,padding:"10px 12px",background:"#0d0d18",borderRadius:8,border:"1px solid #1e1e38" }}>
      <label style={{ display:"flex",alignItems:"center",gap:8,cursor:"pointer",color:"#ccc",fontSize:13 }}>
        <input type="checkbox" checked={isEnabled} onChange={e=>setEnabled(e.target.checked)} style={{ accentColor:"#f5a623",width:16,height:16 }} />
        Require category minimums
      </label>
      {isEnabled && (
        <div style={{ marginTop:10 }}>
          <div style={{ display:"flex",gap:8,marginBottom:10,flexWrap:"wrap" }}>
            <span style={{ fontSize:11,fontWeight:600,color:"#8888aa",alignSelf:"center" }}>Category:</span>
            {[
              { id: "gender", label: "Gender", available: true },
              { id: "tribe", label: "Tribe", available: tribeNames.length > 0 },
            ].map(opt => (
              <button key={opt.id} disabled={!opt.available} onClick={()=>setCategory(opt.id)} title={!opt.available ? "Add tribes on the Cast tab first" : ""} style={{
                padding:"5px 12px",borderRadius:99,fontSize:11,fontWeight:600,cursor:opt.available?"pointer":"not-allowed",
                background:category===opt.id?"#f5a62322":"transparent",
                border:category===opt.id?"1px solid #f5a62366":"1px solid #2a2a4a",
                color:category===opt.id?"#f5a623":opt.available?"#7a7a9a":"#3a3a4a",fontFamily:"'Outfit',sans-serif",
              }}>{opt.label}</button>
            ))}
          </div>
          {valueOptions.length === 0 ? (
            <div style={{ fontSize:11,color:"#e94560",fontStyle:"italic",lineHeight:1.4 }}>
              No values available for category "{category}". Add some on the Cast tab first.
            </div>
          ) : (
            <div style={{ display:"flex",gap:8,flexWrap:"wrap" }}>
              {valueOptions.map(val => (
                <div key={val} style={{ flex:"1 1 100px",minWidth:90 }}>
                  <Input label={`Min ${val}`} type="number" min="0" max={totalSlots} value={Number(minimums[val] || 0)}
                    onChange={e=>setMinimum(val, e.target.value)} />
                </div>
              ))}
            </div>
          )}
          {exceeds && (
            <div style={{ fontSize:11,color:"#e94560",fontWeight:600,marginTop:2 }}>
              Minimums ({total}) exceed roster size ({totalSlots}). Adjust to a valid configuration.
            </div>
          )}
          <div style={{ fontSize:11,color:"#6a6a8a",marginTop:6,fontStyle:"italic",lineHeight:1.4 }}>
            Each manager's depth chart must include at least this many of each {category}. Remaining slots can be any {category}.
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsTab({ league, onUpdate, allLeagues, setModal, setEditing, userProfile }) {
  const [editingInfo, setEditingInfo] = useState(false);
  const [leagueInfo, setLeagueInfo] = useState({
    name: league.name || "",
    showName: league.showName || "",
    seasonName: league.seasonName || "",
    seasonNumber: league.seasonNumber ? String(league.seasonNumber) : "",
  });
  const [section, setSection] = useState("general");
  const [pendingCommissioner, setPendingCommissioner] = useState(null);
  const sections = [
    { id: "general", label: "General" },
    { id: "scoring", label: "Scoring Rules" },
    { id: "roster", label: "Roster" },
    { id: "invite", label: "Invite & Teams" },
    { id: "spoiler", label: "Spoiler" },
    { id: "danger", label: "Danger Zone" },
  ];

  function saveLeagueInfo() {
    const sn = Number(leagueInfo.seasonNumber);
    const next = {
      ...league,
      name: leagueInfo.name.trim(),
      showName: leagueInfo.showName.trim(),
      seasonName: leagueInfo.seasonName.trim(),
      ...(sn && sn >= 1 ? { seasonNumber: sn } : { seasonNumber: null }),
    };
    onUpdate(next);
    setEditingInfo(false);
  }

  return (
    <div>
      <h3 style={{ margin:"0 0 16px",fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>League Settings</h3>

      <div style={{ display:"flex",gap:6,marginBottom:20,overflowX:"auto" }}>
        {sections.map(s => (
          <button key={s.id} onClick={()=>setSection(s.id)} style={{
            padding:"8px 14px",borderRadius:99,border:section===s.id?"1px solid #e9456044":"1px solid transparent",
            background:section===s.id?"#e9456022":"transparent",color:section===s.id?"#e94560":"#7a7a9a",
            fontSize:12,fontWeight:section===s.id?700:500,cursor:"pointer",whiteSpace:"nowrap",
            fontFamily:"'Outfit',sans-serif",transition:"all .15s",
          }}>{s.label}</button>
        ))}
      </div>

      {/* ─── GENERAL SECTION ─── */}
      {section === "general" && <>
      {/* League Info */}
      <div style={{ marginBottom:20,padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0" }}>League Info</div>
          <Btn small variant={editingInfo?"primary":"ghost"} onClick={()=>editingInfo?saveLeagueInfo():setEditingInfo(true)}>
            {editingInfo?<><Icon name="save" size={12}/> Save</>:<><Icon name="edit" size={12}/> Edit</>}
          </Btn>
        </div>
        {editingInfo ? (
          <div>
            <Input label="League Name" value={leagueInfo.name} onChange={e=>setLeagueInfo({...leagueInfo,name:e.target.value})} />
            <Input label="Show Name" value={leagueInfo.showName} onChange={e=>setLeagueInfo({...leagueInfo,showName:e.target.value})} />
            {/* v2.6.5.0: structured Season # selector — used for show-wide
                scoring key matching. Season Name stays free-text for branding. */}
            <div style={{ display:"flex",gap:10 }}>
              <div style={{ width:140 }}>
                <Select label="Season #" value={leagueInfo.seasonNumber} onChange={e=>setLeagueInfo({...leagueInfo, seasonNumber: e.target.value})} options={[
                  { value: "", label: "— Unset —" },
                  ...Array.from({length: 60}, (_, i) => ({ value: String(i+1), label: `Season ${i+1}` })),
                ]} />
              </div>
              <div style={{ flex:1 }}>
                <Input label="Season Name" value={leagueInfo.seasonName} onChange={e=>setLeagueInfo({...leagueInfo,seasonName:e.target.value})} />
              </div>
            </div>
            <div style={{ fontSize:10,color:"#6a6a8a",marginTop:-8,marginBottom:14,fontStyle:"italic",lineHeight:1.4 }}>
              Season # is the key the global admin scores against. Set this to opt into show-wide scoring without name-matching issues.
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1a1a30" }}>
              <span style={{ color:"#6a6a8a",fontSize:12 }}>League Name</span>
              <span style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>{league.name}</span>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1a1a30" }}>
              <span style={{ color:"#6a6a8a",fontSize:12 }}>Show</span>
              <span style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>{league.showName}</span>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #1a1a30" }}>
              <span style={{ color:"#6a6a8a",fontSize:12 }}>Season</span>
              <span style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>{league.seasonName}{league.seasonNumber ? ` (#${league.seasonNumber})` : ""}</span>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",padding:"6px 0" }}>
              <span style={{ color:"#6a6a8a",fontSize:12 }}>Current {cadenceWord(league)}</span>
              <span style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>{league.currentWeek}</span>
            </div>
          </div>
        )}
      </div>

      {/* Admin's team selector */}
      <div style={{ marginBottom:20,padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
        <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:8 }}>My Team</div>
        <div style={{ fontSize:12,color:"#6a6a8a",marginBottom:8 }}>Which team is yours? This determines your default on the My Roster tab.</div>
        <select value={league.adminTeamId||""} onChange={e=>onUpdate({...league,adminTeamId:e.target.value||null})} style={{
          width:"100%",padding:"8px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",
          borderRadius:6,color:"#e8e8f0",fontSize:13,fontFamily:"'Outfit',sans-serif",
        }}>
          <option value="">— None —</option>
          {(league.teams||[]).map(t=><option key={t.id} value={t.id}>{t.name} ({t.owner})</option>)}
        </select>
      </div>

      {/* v2.4.49.0: Linked Scoring is hidden pending the Show-Wide Scoring
          rework (see backlog). Single-admin-runs-multiple-leagues-for-the-same-
          show is a real use case but the current implementation needs work; the
          new global admin scoring layer will replace it cleanly. Leaving the
          component code in place so it can be re-enabled in one line.
      <LinkedScoringSection league={league} allLeagues={allLeagues} onUpdate={onUpdate} /> */}

      {/* v2.6.3.0: opt-in for show-wide cascade scoring
          v2.6.5.0: gates on league.seasonNumber being set (structured key). */}
      <div style={{ marginBottom:20,padding:"16px",background:league.useShowWideScoring?"#9d5dff11":"#12121f",borderRadius:10,border:league.useShowWideScoring?"1px solid #9d5dff33":"1px solid #1e1e38" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:4,display:"flex",alignItems:"center",gap:6 }}>
              {league.useShowWideScoring ? "🌐" : "○"} Use show-wide scoring
              {league.useShowWideScoring && <Badge color="#9d5dff">ON</Badge>}
            </div>
            <div style={{ fontSize:12,color:"#8888aa",lineHeight:1.5 }}>
              When on, this league picks up events the global admin scores for <strong style={{color:"#e8e8f0"}}>{(SHOW_PRESETS[league.showType]?.name) || league.showName}</strong> &middot; <strong style={{color:"#e8e8f0"}}>{league.seasonNumber ? `Season ${league.seasonNumber}` : "(season # not set)"}</strong> at render time. Each event count is multiplied by THIS league's point value for that rule. Contestant names in your league need to match the names the admin uses (case-insensitive trim).
            </div>
            {league.useShowWideScoring && !league.seasonNumber && (
              <div style={{ marginTop:8,padding:"8px 10px",background:"#e9456011",border:"1px solid #e9456033",borderRadius:6,fontSize:11,color:"#e94560",fontWeight:600 }}>
                Set the Season # in General &rsaquo; League Info above to receive show-wide events. Without it the cascade key can't be computed.
              </div>
            )}
          </div>
          <Btn small variant={league.useShowWideScoring?"danger":"secondary"} onClick={()=>{
            const next = !league.useShowWideScoring;
            const actorName = userProfile?.displayName || "Commissioner";
            const audited = appendAudit(league, {
              type: "setting", actorName,
              desc: `${actorName} ${next ? "enabled" : "disabled"} show-wide scoring`,
              meta: { setting: "useShowWideScoring", value: next },
            });
            onUpdate({ ...audited, useShowWideScoring: next });
          }}>
            {league.useShowWideScoring ? "Turn Off" : "Turn On"}
          </Btn>
        </div>
      </div>

      {/* Episodes per Week */}
      <div style={{ marginBottom:20,padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
        <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:8 }}>Episodes per Week</div>
        <div style={{ fontSize:12,color:"#8888aa",lineHeight:1.5,marginBottom:10 }}>
          Scoring is always per episode. This sets how many episodes air per week — i.e., how often the league advances a week and (for Standard format) when the snake redraft happens. Set to 1 for most shows; higher for shows like Love Island (~6) or Big Brother (3).
        </div>
        <Input label="Episodes per Week" type="number" min="1" max="14"
          value={effectiveEpisodesPerWeek(league)}
          onChange={e=>onUpdate({...league, episodesPerWeek: Number(e.target.value) || 1})} />
        <div style={{ fontSize:11,color:"#6a6a8a",marginTop:4,fontStyle:"italic",lineHeight:1.4 }}>
          Changing this mid-season switches the unit label between "Week" and "Episode". Existing scored data isn't reshuffled.
        </div>
      </div>

      {/* v2.4.49.0: Finale Mode moved to the Roster section (it's a roster-shape
          override — finale couples replace the depth chart). See section === "roster" below. */}

      <div style={{ marginBottom:20,padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
        <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:8 }}>
          {formatInfo(league)[league.format]?.icon} {formatInfo(league)[league.format]?.name} Format
        </div>
        <div style={{ fontSize:12,color:"#8888aa",lineHeight:1.5 }}>{formatInfo(league)[league.format]?.desc}</div>
        {league.format==="captains" && <div style={{ fontSize:12,color:"#6a6a8a",marginTop:6 }}>Regular slots: {league.captainsConfig?.regularSlots||3}</div>}
        {league.format==="standard" && <div style={{ fontSize:12,color:"#6a6a8a",marginTop:6 }}>Picks/manager: {league.standardConfig?.picksPerManager||2} · Gendered: {league.standardConfig?.genderedDraft?"Yes":"No"}</div>}
        {league.format === "captains" && <CategoryMinimumsEditor league={league} onUpdate={onUpdate} />}
      </div>
      </>}

      {/* ─── SCORING RULES SECTION ─── */}
      {section === "scoring" && <ScoringRulesSection league={league} onUpdate={onUpdate} userProfile={userProfile} />}

      {/* ─── ROSTER SECTION ─── */}
      {section === "roster" && <>
      {/* Finale Mode — only meaningful for captains format. Moved here from
          General in v2.4.49.0 because it's a roster-shape override (depth chart
          → couples picker), not a general league setting. */}
      {league.format === "captains" && (
        <div style={{ marginBottom:20,padding:"16px",background:league.finaleActive?"#e9456011":"#12121f",borderRadius:10,border:league.finaleActive?"1px solid #e9456033":"1px solid #1e1e38",transition:"all 0.2s ease" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:4,display:"flex",alignItems:"center",gap:6 }}>
                {league.finaleActive ? "♥" : "○"} Finale Mode {league.finaleActive && <Badge color="#e94560">ACTIVE</Badge>}
              </div>
              <div style={{ fontSize:12,color:"#8888aa",lineHeight:1.5 }}>
                Flip this on for the finale {cadenceWord(league).toLowerCase()} only — managers' depth charts swap to a couple picker (Hero couple ×2, Sidekick couple ×1.5). Affects the current {cadenceWord(league).toLowerCase()}; turn off after the finale to return to the normal depth chart. Requires couples on the Manage Contestants → Couples tab.
              </div>
            </div>
            <Btn small variant={league.finaleActive?"danger":"secondary"} onClick={()=>onUpdate({...league, finaleActive: !league.finaleActive})}>
              {league.finaleActive ? "Turn Off" : "Turn On"}
            </Btn>
          </div>
        </div>
      )}
      {(() => {
        // v2.5.3.0: banner reflects effective lock state (manual OR auto).
        // The toggle still flips the manual override only; the explainer below
        // tells the commissioner when auto-lock is what's holding the lock.
        const autoState = getAutoLockState(league);
        const effective = isRosterLocked(league);
        const manual = !!league.rostersLocked;
        const fmtAirtime = (d) => {
          if (!d) return null;
          const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
          const h = d.getHours();
          const m = d.getMinutes();
          const ampm = h >= 12 ? "PM" : "AM";
          const h12 = ((h + 11) % 12) + 1;
          return `${days[d.getDay()]} ${h12}:${m.toString().padStart(2,"0")} ${ampm}`;
        };
        let detail = effective
          ? "Rosters are locked. Managers cannot make changes."
          : "Rosters are open. Managers can edit their rosters.";
        let autoExplainer = null;
        if (autoState.autoLocked && !manual) {
          autoExplainer = `Auto-locked because the episode aired (lock started ${fmtAirtime(autoState.lockStart)}). Score the ${cadenceWord(league).toLowerCase()} to release.`;
        } else if (!autoState.autoLocked && autoState.nextLockStart) {
          autoExplainer = `Auto-lock next: ${fmtAirtime(autoState.nextLockStart)} (airs ${fmtAirtime(autoState.nextAirtime)}).`;
        }
        return (
          <div style={{ marginBottom:20,padding:"16px",background:effective?"#e9456011":"#12121f",borderRadius:10,
            border:effective?"1px solid #e9456033":"1px solid #1e1e38",transition:"all 0.2s ease" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:10 }}>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",display:"flex",alignItems:"center",gap:6 }}>
                  {effective ? "🔒" : "🔓"} Roster Lock
                  {effective && !manual && <Badge color="#f5a623">AUTO</Badge>}
                </div>
                <div style={{ fontSize:12,color:"#6a6a8a",marginTop:4 }}>{detail}</div>
                {autoExplainer && <div style={{ fontSize:11,color:"#8888aa",marginTop:4,fontStyle:"italic",lineHeight:1.4 }}>{autoExplainer}</div>}
              </div>
              <Btn small variant={manual?"danger":"secondary"}
                onClick={()=>{
                  const actorName = userProfile?.displayName || "Commissioner";
                  const next = !manual;
                  const audited = appendAudit(league, {
                    type: "lock",
                    actorName,
                    desc: `${actorName} ${next ? "manually locked" : "manually unlocked"} rosters`,
                  });
                  onUpdate({ ...audited, rostersLocked: next });
                }}>
                {manual ? "Unlock" : "Lock"}
              </Btn>
            </div>
          </div>
        );
      })()}

      {/* ─── Final Lock-In (Heroes only) ─── */}
      {isLockInEligible(league) && (
        <FinalLockInCommishPanel league={league} onUpdate={onUpdate} />
      )}

      <div style={{ marginBottom:20,padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
        <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:12 }}>Contestant Status</div>
        {(league.contestants||[]).filter(c=>c.status!=="eliminated").map(c=>(
          <EliminateRow key={c.id} contestant={c} league={league} onUpdate={onUpdate} />
        ))}
        {(league.contestants||[]).filter(c=>c.status!=="eliminated").length===0 && <div style={{ color:"#4a4a6a",fontSize:12 }}>No active contestants</div>}

        {/* Eliminated contestants */}
        {(league.contestants||[]).filter(c=>c.status==="eliminated").length > 0 && (
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:12,fontWeight:600,color:"#6a6a8a",textTransform:"uppercase",marginBottom:8 }}>Eliminated</div>
            {(league.contestants||[]).filter(c=>c.status==="eliminated").sort((a,b)=>(a.eliminatedWeek||0)-(b.eliminatedWeek||0)).map(c=>(
              <div key={c.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #1a1a30" }}>
                <div style={{ flex:1 }}>
                  <span style={{ color:"#6a6a8a",fontSize:13 }}>{c.name}</span>
                  {c.eliminatedWeek && <span style={{ color:"#e94560",fontSize:10,marginLeft:6 }}>{cadenceLabel(league, c.eliminatedWeek)}</span>}
                </div>
                <Btn small variant="ghost" onClick={()=>onUpdate({...league,contestants:league.contestants.map(x=>x.id===c.id?{...x,status:"active",eliminatedWeek:null}:x)})}>Reinstate</Btn>
              </div>
            ))}
          </div>
        )}
      </div>
      </>}

      {/* ─── INVITE SECTION ─── */}
      {section === "invite" && <>
      <div style={{ marginBottom:20,padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
        <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:4 }}>League Invite</div>
        <div style={{ fontSize:12,color:"#6a6a8a",marginBottom:10,lineHeight:1.4 }}>
          Share this code or link with anyone. They'll auto-join with a new team when they enter it.
        </div>
        {league.leagueInviteCode ? (
          <div>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
              <div style={{ flex:1,padding:"10px 14px",background:"#0d0d18",borderRadius:8,fontFamily:"monospace",fontSize:18,
                color:"#4ecdc4",letterSpacing:"0.15em",textAlign:"center",fontWeight:700 }}>{league.leagueInviteCode}</div>
              <Btn small variant="ghost" onClick={()=>{
                navigator.clipboard?.writeText(league.leagueInviteCode);
              }}>Copy</Btn>
            </div>
            <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
              <div style={{ flex:1,padding:"8px 12px",background:"#0d0d18",borderRadius:8,fontSize:12,
                color:"#6a6a8a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                {"https://app.fantasyrealitytv.com?join=" + league.leagueInviteCode}
              </div>
              <Btn small variant="ghost" onClick={()=>{
                navigator.clipboard?.writeText("https://app.fantasyrealitytv.com?join=" + league.leagueInviteCode);
              }}>Copy Link</Btn>
            </div>
            <Btn small variant="ghost" onClick={()=>onUpdate({...league, leagueInviteCode: generateInviteCode()})}>Regenerate Code</Btn>
          </div>
        ) : (
          <Btn small onClick={()=>onUpdate({...league, leagueInviteCode: generateInviteCode()})}>Generate Invite Code</Btn>
        )}
      </div>

      <div style={{ marginBottom:20,padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10 }}>
          <div>
            <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0" }}>Teams</div>
            <div style={{ fontSize:12,color:"#6a6a8a",marginTop:2,lineHeight:1.4 }}>
              Add a team, edit names, send per-team invite codes, or remove a team. Standings and rosters live on the Standings tab — open a row there to see a team's depth chart.
            </div>
          </div>
          <Btn small onClick={()=>{setEditing(null);setModal("add-team")}}><Icon name="plus" size={14}/> Add Team</Btn>
        </div>
        {(league.teams||[]).length === 0 ? (
          <div style={{ padding:"20px",textAlign:"center",color:"#6a6a8a",fontSize:13,background:"#0d0d18",borderRadius:8,border:"1px dashed #2a2a4a" }}>
            No teams yet. Add one above to start the league.
          </div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {(league.teams||[]).map(team => (
              <div key={team.id} style={{ padding:"12px",background:"#0d0d18",borderRadius:8,border:"1px solid #1e1e38" }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:6 }}>
                  {team.teamAvatar ? (
                    <img src={team.teamAvatar} alt={team.name} style={{ width:36,height:36,borderRadius:10,objectFit:"cover",border:"2px solid "+(team.teamColor||"#e94560"),flexShrink:0 }} />
                  ) : (
                    <div style={{ width:36,height:36,borderRadius:10,background:team.teamColor||"linear-gradient(135deg,#2a2a5a,#3a3a6a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:"#fff",flexShrink:0 }}>{team.name?.[0]}</div>
                  )}
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ color:"#e8e8f0",fontWeight:700,fontSize:13 }}>{team.name}</div>
                    <div style={{ color:"#6a6a8a",fontSize:11,marginTop:1 }}>{team.owner}</div>
                  </div>
                </div>
                <TeamCardActions team={team} league={league} onUpdate={onUpdate} setEditing={setEditing} setModal={setModal} />
              </div>
            ))}
          </div>
        )}
      </div>
      </>}

      {/* ─── SPOILER SECTION ─── */}
      {section === "spoiler" && <>
      <SpoilerProtectionEditor league={league} onUpdate={onUpdate} />
      </>}

      {/* ─── DANGER ZONE SECTION ─── */}
      {section === "danger" && <>
      {/* Transfer Commissioner */}
      {(league.teams||[]).length > 0 && (
        <div style={{ marginBottom:20,padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
          <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:4 }}>Transfer Commissioner</div>
          <div style={{ fontSize:12,color:"#6a6a8a",marginBottom:10,lineHeight:1.4 }}>
            Hand off commissioner powers to a team owner. When they next log in, they'll have full control of this league.
          </div>
          <select value={pendingCommissioner || ""} onChange={e => setPendingCommissioner(e.target.value || null)} style={{
            width:"100%",padding:"8px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",
            borderRadius:6,color:"#e8e8f0",fontSize:13,fontFamily:"'Outfit',sans-serif",
          }}>
            <option value="">— Select new commissioner —</option>
            {(league.teams||[]).map(t => (
              <option key={t.id} value={t.id}>{t.owner} ({t.name})</option>
            ))}
          </select>
          {pendingCommissioner && (
            <div style={{ display:"flex",gap:8,marginTop:10 }}>
              <Btn small variant="danger" onClick={()=>{
                const team = (league.teams||[]).find(t=>t.id===pendingCommissioner);
                if(!team) return;
                if (!confirm(`Transfer commissioner to ${team.owner}? You'll lose commissioner access.`)) { setPendingCommissioner(null); return; }
                onUpdate({...league, commissionerTeamId: pendingCommissioner, commissionerName: team.owner});
                setPendingCommissioner(null);
              }}>Transfer</Btn>
              <Btn small variant="ghost" onClick={()=>setPendingCommissioner(null)}>Cancel</Btn>
            </div>
          )}
          {league.commissionerName && <div style={{ marginTop:8,fontSize:11,color:"#4ecdc4" }}>Current commissioner: {league.commissionerName}</div>}
        </div>
      )}

      {/* Import from XLSX */}
      <ImportXLSXSection league={league} onUpdate={onUpdate} />

      <div style={{ padding:"16px",background:"#1a0a10",borderRadius:10,border:"1px solid #3a1525" }}>
        <div style={{ fontSize:14,fontWeight:700,color:"#e94560",marginBottom:4 }}>Danger Zone</div>
        <div style={{ fontSize:12,color:"#6a6a8a",marginBottom:12,lineHeight:1.4 }}>These actions cannot be undone.</div>
        <div style={{ display:"flex",gap:8,flexWrap:"wrap",flexDirection:"column" }}>
          <Btn variant="danger" small onClick={()=>{if(confirm("Clear ALL scores for this league? Teams keep their rosters but all scoring data will be erased. This cannot be undone.")) onUpdate({...league,weeklyScores:{},currentWeek:1})}}>Reset All Scores</Btn>
          <Btn variant="danger" small onClick={()=>{
            const data = JSON.stringify(league, null, 2);
            const blob = new Blob([data], {type:"application/json"});
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = (league.name||"league").replace(/[^a-z0-9]/gi,"_") + "_backup.json";
            a.click();
            URL.revokeObjectURL(url);
          }}>Export League Backup (JSON)</Btn>
        </div>
      </div>
      </>}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODALS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function resizeImageToDataURI(blob, maxDim = 512, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not decode image"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(blob);
  });
}

function AddContestantModal({ open, onClose, league, onUpdate, editing }) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoCropY, setPhotoCropY] = useState(20);
  const [photoCropZoom, setPhotoCropZoom] = useState(1);
  const [photoError, setPhotoError] = useState("");
  // Mode: "single" = the per-contestant form, "bulk" = paste-many. Editing forces
  // single (you can't bulk-edit an existing contestant through this modal).
  const [mode, setMode] = useState("single");

  useEffect(() => {
    if (editing) { setName(editing.name||""); setBio(editing.bio||""); setGender(editing.gender||""); setPhotoUrl(editing.photoUrl||""); setPhotoCropY(editing.photoCropY||20); setPhotoCropZoom(editing.photoCropZoom||1); }
    else { setName(""); setBio(""); setGender(""); setPhotoUrl(""); }
    setPhotoError("");
    setMode("single");
  }, [editing, open]);

  async function handlePhotoFile(file) {
    if (!file) return;
    if (!file.type?.startsWith("image/")) { setPhotoError("File must be an image"); return; }
    try {
      setPhotoError("");
      const dataUri = await resizeImageToDataURI(file, 512, 0.8);
      setPhotoUrl(dataUri);
    } catch (err) {
      setPhotoError("Could not process image — try another file");
    }
  }
  function handlePhotoPaste(e) {
    const items = e.clipboardData?.items || [];
    for (const it of items) {
      if (it.type?.startsWith("image/")) {
        e.preventDefault();
        const blob = it.getAsFile();
        if (blob) handlePhotoFile(blob);
        return;
      }
    }
  }

  function handleSave() {
    if (!name.trim()) return;
    const contestant = { id: editing?.id || generateId(), name: name.trim(), bio: bio.trim(), gender: gender.trim(), photoUrl: photoUrl.trim(), photoCropY: Number(photoCropY), photoCropZoom: Number(photoCropZoom), status: editing?.status || "active", tribe: editing?.tribe || "" };
    if (editing) onUpdate({ ...league, contestants: league.contestants.map(c=>c.id===editing.id?{...c,...contestant}:c) });
    else onUpdate({ ...league, contestants: [...(league.contestants||[]), contestant] });
    onClose();
  }
  function handleDelete() {
    if (!editing || !confirm("Delete contestant?")) return;
    onUpdate({ ...league, contestants: league.contestants.filter(c=>c.id!==editing.id) });
    onClose();
  }

  const isDataUri = photoUrl?.startsWith("data:");
  const displayUrl = isDataUri ? "" : photoUrl;

  return (
    <Modal open={open} onClose={onClose} title={editing?"Edit Contestant":"Add Contestant"}>
      {!editing && (
        <div style={{ display:"flex",gap:6,marginBottom:14 }}>
          {[{id:"single",label:"Single"},{id:"bulk",label:"Bulk paste"}].map(m => (
            <button key={m.id} onClick={()=>setMode(m.id)} style={{
              padding:"6px 14px",borderRadius:99,border:mode===m.id?"1px solid #e9456044":"1px solid #1e1e38",
              background:mode===m.id?"#e9456018":"transparent",color:mode===m.id?"#e94560":"#7a7a9a",
              fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Outfit',sans-serif",transition:"all .15s",
            }}>{m.label}</button>
          ))}
        </div>
      )}
      {mode === "bulk" && !editing ? (
        <BulkAddBody league={league} onUpdate={onUpdate} onClose={onClose} />
      ) : (<>
      <Input label="Name" placeholder="e.g. Buddha Lo" value={name} onChange={e=>setName(e.target.value)} />
      <div style={{ marginBottom:14 }}>
        <label style={{ display:"block",fontSize:12,color:"#8888aa",marginBottom:5,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em" }}>Photo</label>
        <input value={displayUrl} onChange={e=>setPhotoUrl(e.target.value)} onPaste={handlePhotoPaste}
          placeholder={isDataUri ? "Image attached · type a URL or paste/upload to replace" : "https://example.com/headshot.jpg"}
          style={{ width:"100%",padding:"10px 14px",background:"#12121f",border:"1px solid #2a2a4a",borderRadius:8,color:"#e8e8f0",fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"'Outfit',sans-serif" }} />
        <div style={{ display:"flex",alignItems:"center",gap:10,marginTop:6,fontSize:11,color:"#6a6a8a",flexWrap:"wrap" }}>
          <label style={{ cursor:"pointer",color:"#4ecdc4",textDecoration:"underline" }}>
            Upload image
            <input type="file" accept="image/*" onChange={e=>{ handlePhotoFile(e.target.files?.[0]); e.target.value=""; }} style={{ display:"none" }} />
          </label>
          <span>or paste with Ctrl+V into the field above</span>
          {isDataUri && <span style={{ color:"#4ecdc4" }}>✓ Image attached ({Math.round(photoUrl.length/1024)} KB)</span>}
          {photoError && <span style={{ color:"#e94560" }}>{photoError}</span>}
        </div>
      </div>
      <div style={{ marginBottom:14 }}>
        <label style={{ display:"block",fontSize:12,color:"#8888aa",marginBottom:5,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em" }}>Bio</label>
        <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder={"Paste the full bio here. Lines like \"Hometown: City\" will auto-format with bold labels."} rows={5} style={{
          width:"100%",padding:"10px 14px",background:"#12121f",border:"1px solid #2a2a4a",
          borderRadius:8,color:"#e8e8f0",fontSize:14,fontFamily:"'Outfit',sans-serif",resize:"vertical",boxSizing:"border-box",lineHeight:1.5
        }} />
      </div>
      <Select label="Gender" value={gender} onChange={e=>setGender(e.target.value)} options={[
        { value:"", label:"— Not set —" },
        { value:"Male", label:"Male" },
        { value:"Female", label:"Female" },
      ]} />
      {photoUrl && (
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block",fontSize:12,color:"#8888aa",marginBottom:5,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em" }}>Thumbnail Position</label>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <div style={{ width:72,height:72,borderRadius:14,overflow:"hidden",border:"2px solid #2a2a4a",flexShrink:0 }}>
              <img src={photoUrl} alt="Preview" style={{ width:"100%",height:"100%",objectFit:"cover",objectPosition:`center ${photoCropY}%`,transform:`scale(${photoCropZoom})`,transformOrigin:`center ${photoCropY}%` }} onError={e=>{e.target.style.display="none"}} />
            </div>
            <div style={{ flex:1 }}>
              <input type="range" min="0" max="100" value={photoCropY} onChange={e=>setPhotoCropY(e.target.value)}
                style={{ width:"100%",accentColor:"#e94560" }} />
              <div style={{ display:"flex",justifyContent:"space-between",fontSize:10,color:"#4a4a6a",marginTop:2 }}>
                <span>Top</span><span>Center</span><span>Bottom</span>
              </div>
              <div style={{ marginTop:8 }}>
                <div style={{ fontSize:11,color:"#6a6a8a",marginBottom:2 }}>Zoom: {Math.round(photoCropZoom*100)}%</div>
                <input type="range" min="1" max="3" step="0.1" value={photoCropZoom} onChange={e=>setPhotoCropZoom(e.target.value)}
                  style={{ width:"100%",accentColor:"#4ecdc4" }} />
              </div>
            </div>
          </div>
          <div style={{ width:72,height:72,borderRadius:14,overflow:"hidden",border:"2px solid #2a2a4a",flexShrink:0 }}>
            <img src={photoUrl} alt="Zoomed" style={{ width:"100%",height:"100%",objectFit:"cover",objectPosition:`center ${photoCropY}%`,transform:`scale(${photoCropZoom})`,transformOrigin:`center ${photoCropY}%` }} onError={e=>{e.target.style.display="none"}} />
          </div>
        </div>
      )}
      <div style={{ display:"flex",gap:8,marginTop:16 }}>
        {editing && <Btn variant="danger" onClick={handleDelete}><Icon name="trash" size={14}/> Delete</Btn>}
        <div style={{ flex:1 }}/>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSave} disabled={!name.trim()}>{editing?"Save":"Add"}</Btn>
      </div>
      </>)}
    </Modal>
  );
}

function AddTeamModal({ open, onClose, league, onUpdate, editing }) {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");

  useEffect(() => {
    if (editing) { setName(editing.name||""); setOwner(editing.owner||""); }
    else { setName(""); setOwner(""); }
  }, [editing, open]);

  function handleSave() {
    if (!name.trim()) return;
    if (editing) onUpdate({ ...league, teams: league.teams.map(t=>t.id===editing.id?{...t,name:name.trim(),owner:owner.trim()}:t) });
    else onUpdate({ ...league, teams: [...(league.teams||[]), { id:generateId(), name:name.trim(), owner:owner.trim(),
      depthChart:{captain:null,coCaptain:null,regulars:[]}, weeklyRosters:{}, weeklyDepthCharts:{} }] });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={editing?"Edit Team":"Add Team"}>
      <Input label="Team Name" placeholder="e.g. Flavor Town Destroyers" value={name} onChange={e=>setName(e.target.value)} />
      <Input label="Owner / Manager" placeholder="e.g. Mike" value={owner} onChange={e=>setOwner(e.target.value)} />
      <div style={{ display:"flex",gap:8,marginTop:16 }}>
        <div style={{ flex:1 }}/>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSave} disabled={!name.trim()}>{editing?"Save":"Add Team"}</Btn>
      </div>
    </Modal>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN APP
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function JoinConfirmModal({ pendingJoin, onConfirm, onCancel, displayName, error }) {
  if (!pendingJoin) return null;
  const { league, type, teamId } = pendingJoin;
  const fmtInfo = formatInfo(league)[league.format] || {};
  const showInfo = SHOW_PRESETS[league.showType] || {};
  const teamCount = (league.teams || []).length;
  const existingTeam = type === "team" ? (league.teams || []).find(t => t.id === teamId) : null;

  return (
    <Modal open title="Join League?" onClose={onCancel}>
      <div style={{ display:"flex",alignItems:"center",gap:14,marginBottom:16 }}>
        <div style={{ width:48,height:48,borderRadius:12,background:(showInfo.color||"#9d5dff")+"18",
          border:"1px solid "+(showInfo.color||"#9d5dff")+"33",
          display:"flex",alignItems:"center",justifyContent:"center",
          fontFamily:"'Anybody',sans-serif",fontSize:16,fontWeight:900,
          color:showInfo.color||"#9d5dff",flexShrink:0
        }}>{showInfo.emoji||"TV"}</div>
        <div>
          <div style={{ color:"#e8e8f0",fontWeight:700,fontSize:16,fontFamily:"'Anybody',sans-serif" }}>{league.name}</div>
          <div style={{ color:"#6a6a8a",fontSize:12,marginTop:2 }}>{league.seasonName}</div>
        </div>
      </div>
      <div style={{ display:"flex",flexWrap:"wrap",gap:8,marginBottom:16 }}>
        <Badge color={showInfo.color||"#9d5dff"}>{fmtInfo.name || league.format}</Badge>
        <Badge color="#6a6a8a">{teamCount} team{teamCount !== 1 ? "s" : ""}</Badge>
        <Badge color="#6a6a8a">{cadenceLabel(league, league.currentWeek || 1)}</Badge>
      </div>
      <div style={{ padding:"12px 14px",background:"#0d0d18",borderRadius:10,border:"1px solid #1e1e38",marginBottom:20 }}>
        <div style={{ color:"#8888aa",fontSize:12 }}>
          {type === "team"
            ? <>You'll be linked to team: <span style={{ color:"#e8e8f0",fontWeight:600 }}>{existingTeam?.name || "Unknown"}</span></>
            : <>A new team will be created: <span style={{ color:"#e8e8f0",fontWeight:600 }}>Team {displayName}</span></>
          }
        </div>
      </div>
      {error && <div style={{ color:"#e94560",fontSize:12,marginBottom:12,padding:"8px 10px",background:"#e9456011",borderRadius:6,border:"1px solid #e9456033" }}>{error}</div>}
      <div style={{ display:"flex",gap:10 }}>
        <Btn variant="ghost" onClick={onCancel} style={{ flex:1 }}>Cancel</Btn>
        <Btn onClick={onConfirm} style={{ flex:1 }}>Join League</Btn>
      </div>
    </Modal>
  );
}

export default function FantasyRealityTV() {
  const [leagues, setLeagues] = useState([]);
  const [view, setView] = useState("loading"); // loading | login | home | league | create
  const [selectedId, setSelectedId] = useState(null);
  const [authUser, setAuthUser] = useState(null); // Firebase Auth user object
  const [userProfile, setUserProfile] = useState(null); // {displayName, activations: {leagueId: teamId}}
  const [authLoading, setAuthLoading] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const [pendingJoinCode, setPendingJoinCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get("join");
    if (joinCode) window.history.replaceState({}, "", window.location.pathname);
    return joinCode ? joinCode.toUpperCase() : "";
  });
  const [featureFlags, setFeatureFlags] = useState({ new_formats: true, h2h: true, best_ball: true, roto: true });
  const [pendingJoin, setPendingJoin] = useState(null); // { league, code, type: "league"|"team", teamId? }
  const [confirmJoinError, setConfirmJoinError] = useState("");

  const isAdmin = authUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      setAuthUser(user);
      if (user) {
        // Load leagues
        let data = await loadAllLeagues();
        if (data.length === 0 && typeof IMPORTED_LEAGUES !== 'undefined') {
          data = JSON.parse(JSON.stringify(IMPORTED_LEAGUES));
          await saveAllLeagues(data);
        }
        setLeagues(data);
        // Load user profile
        let profile = await loadUserProfile(user.uid);
        if (!profile) {
          profile = { displayName: user.displayName || user.email.split("@")[0], activations: {} };
          await saveUserProfile(user.uid, profile);
        }
        setUserProfile(profile);
        // Load site announcement and feature flags
        try { const ann = await loadData("site_announcement", ""); setAnnouncement(ann || ""); } catch {}
        try { const flags = await loadData("feature_flags", null); if (flags) setFeatureFlags(flags); } catch {}
        setView("home");
        // Note: URL-based pendingJoinCode is handled by AppHome's useEffect
        // (calling handleJoinViaCode here uses a stale closure where userProfile=null)
      } else {
        setUserProfile(null);
        setView("login");
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Reload leagues when coming back to home
  async function refreshLeagues() {
    const data = await loadAllLeagues();
    setLeagues(data);
    return data;
  }

  async function persist(updated) {
    setLeagues(updated);
    await saveAllLeagues(updated);
  }

  // Use this for all in-session league edits (scoring, rosters, settings, etc.)
  // Writes only the changed league path — avoids last-write-wins race condition
  // where two managers saving simultaneously would overwrite each other's changes.
  async function persistLeague(updatedLeague, allUpdated) {
    const updated = allUpdated || leagues.map(l => l.id === updatedLeague.id ? updatedLeague : l);
    setLeagues(updated);
    await saveLeague(updatedLeague);
    // If linked leagues were also touched, save those too
    if (allUpdated) {
      const others = allUpdated.filter(l => l.id !== updatedLeague.id);
      for (const l of others) {
        if (l !== leagues.find(x => x.id === l.id)) {
          await saveLeague(l);
        }
      }
    }
  }

  // v2.5.0.0: `autoConfirm` opts. When true, bypasses the JoinConfirmModal and
  // commits + navigates straight to the joined league. Used for invite LINKS
  // (?join=CODE captured at boot and the post-signup localStorage path) —
  // tapping an invite link is explicit consent, so the modal is just an extra
  // tap. Manual code entry (typing a bare code into the home-screen Join box)
  // still gets the modal as a sanity-check ("you're about to join X").
  async function handleJoinViaCode(inviteCode, opts = {}) {
    if (!authUser || !userProfile) return "Not logged in.";
    const freshLeagues = await refreshLeagues();
    const code = inviteCode.trim().toUpperCase();
    console.log("[JoinViaCode] Searching for code:", code, "across", freshLeagues.length, "leagues");

    for (const league of freshLeagues) {
      // Check league-level invite code (new system — auto-create team)
      if (league.leagueInviteCode) {
        console.log("[JoinViaCode] League", league.name, "has invite code:", league.leagueInviteCode, "match:", league.leagueInviteCode === code);
      }
      if (league.leagueInviteCode && league.leagueInviteCode === code) {
        if (userProfile.activations?.[league.id]) {
          // Already in the league — still navigate so URL-based clicks land
          // on the league dashboard, not stranded on Home.
          if (opts.autoConfirm) { setSelectedId(league.id); setView("league"); setPendingJoinCode(""); }
          return "You're already in this league.";
        }
        const joinInfo = { league, code, type: "league" };
        if (opts.autoConfirm) { return doJoin(joinInfo, freshLeagues); }
        setPendingJoin(joinInfo);
        return null;
      }

      // Legacy: check per-team invite codes
      const codes = league.inviteCodes || {};
      const used = league.usedCodes || [];
      const teamId = Object.entries(codes).find(([tid, c]) => c === code)?.[0];
      if (teamId) {
        console.log("[JoinViaCode] Found legacy team code match, teamId:", teamId);
        if (used.includes(code)) return "This code has already been used.";
        const joinInfo = { league, code, type: "team", teamId };
        if (opts.autoConfirm) { return doJoin(joinInfo, freshLeagues); }
        setPendingJoin(joinInfo);
        return null;
      }
    }
    console.log("[JoinViaCode] Code not found in any league");
    return "Code not found.";
  }

  async function doJoin(info, freshLeaguesOverride) {
    if (!info || !authUser || !userProfile) return "Not logged in.";
    const { league, code, type, teamId } = info;
    try {
      const freshLeagues = freshLeaguesOverride || await refreshLeagues();
      const freshLeague = freshLeagues.find(l => l.id === league.id) || league;

      if (type === "league") {
        const newTeamId = generateId();
        const displayName = userProfile.displayName || authUser.email?.split("@")[0] || "Player";
        const newTeam = {
          id: newTeamId, name: "Team " + displayName, owner: displayName,
          uid: authUser.uid, // v2.6.6.0: stamp the joining user's uid on the team so admin can count distinct users without the parent-read rule
          depthChart: { captain: null, coCaptain: null, regulars: [] },
          weeklyRosters: {}, weeklyDepthCharts: {},
        };
        const updatedLeague = { ...freshLeague, teams: [...(freshLeague.teams||[]), newTeam] };
        const updatedLeagues = freshLeagues.map(l => l.id === league.id ? updatedLeague : l);
        setLeagues(updatedLeagues);
        await saveLeague(updatedLeague);
        const updatedProfile = { ...userProfile, activations: { ...(userProfile.activations || {}), [league.id]: newTeamId } };
        await saveUserProfile(authUser.uid, updatedProfile);
        setUserProfile(updatedProfile);
      } else {
        const freshUsed = freshLeague.usedCodes || [];
        const updatedProfile = { ...userProfile, activations: { ...(userProfile.activations || {}), [league.id]: teamId } };
        await saveUserProfile(authUser.uid, updatedProfile);
        setUserProfile(updatedProfile);
        // v2.6.6.0: stamp uid on the (pre-existing) team so admin can count
        // distinct users without the parent-read rule.
        const teamsWithUid = (freshLeague.teams || []).map(t => t.id === teamId ? { ...t, uid: authUser.uid } : t);
        const updatedLeague = { ...freshLeague, teams: teamsWithUid, usedCodes: [...freshUsed, code] };
        const updatedLeagues = freshLeagues.map(l => l.id === league.id ? updatedLeague : l);
        setLeagues(updatedLeagues);
        await saveLeague(updatedLeague);
      }

      setPendingJoin(null);
      setPendingJoinCode("");
      setConfirmJoinError("");
      setSelectedId(league.id);
      setView("league");
      return null;
    } catch (e) {
      console.error("[doJoin] Error:", e);
      const msg = e.message || "Something went wrong. Please try again.";
      setConfirmJoinError(msg);
      return msg;
    }
  }

  // v2.5.0.0: confirmJoin (modal-button handler) and auto-join (URL flow) now
  // share the same `doJoin` body — see doJoin above. confirmJoin reads from
  // the modal's pendingJoin state; doJoin can be called with explicit info
  // when there's no modal in play (URL-based join).
  async function confirmJoin() {
    if (!pendingJoin) return;
    setConfirmJoinError("");
    await doJoin(pendingJoin);
  }



  async function handleRevealSpoiler(leagueId, week) {
    if (!authUser || !userProfile) return;
    const updated = {
      ...userProfile,
      spoilerRevealed: {
        ...(userProfile.spoilerRevealed || {}),
        [leagueId]: {
          ...(userProfile.spoilerRevealed?.[leagueId] || {}),
          [String(week)]: true
        }
      }
    };
    await saveUserProfile(authUser.uid, updated);
    setUserProfile(updated);
  }

  async function deleteLeague(leagueId) {
    if (!confirm("Delete this league permanently?")) return;
    const updated = leagues.filter(l => l.id !== leagueId);
    await deleteData("league_" + leagueId);
    await saveData("league_index", updated.map(l => l.id));
    setLeagues(updated);
  }

  async function duplicateLeague(leagueId) {
    const source = leagues.find(l => l.id === leagueId);
    if (!source) return;
    const newName = prompt("Name for the new league:", source.name + " (New Season)");
    if (!newName) return;
    const seasonName = prompt("Season name:", "Season " + ((parseInt(source.seasonName?.replace(/\D/g,""))||0) + 1));
    if (!seasonName) return;
    const newLeague = {
      ...JSON.parse(JSON.stringify(source)),
      id: generateId(),
      name: newName.trim(),
      seasonName: seasonName.trim(),
      contestants: [],
      weeklyScores: {},
      currentWeek: 1,
      tribes: {},
      merged: false,
      mergedTribeName: null,
      inviteCodes: {},
      usedCodes: [],
      commissionerUid: authUser?.uid || source.commissionerUid,
      adminTeamId: source.adminTeamId,
      rostersLocked: false,
      createdAt: Date.now(),
      teams: (source.teams || []).map(t => ({
        id: t.id, name: t.name, owner: t.owner,
        depthChart: { captain: null, coCaptain: null, regulars: [] },
        weeklyRosters: {}, weeklyDepthCharts: {},
      })),
    };
    await persist([...leagues, newLeague]);
  }

  const handleLogout = async () => {
    await signOut();
    setAuthUser(null);
    setUserProfile(null);
    setView("login");
  };

  const rawSelected = leagues.find(l => l.id === selectedId);
  // v2.6.3.0: when the selected league has opted into show-wide scoring,
  // fetch the season's events and merge them into the league's weeklyScores
  // at render time. The merged league flows through the rest of the app
  // unchanged — calcStandings, calcContestantWeekPoints, the cast tab, etc.
  // see the augmented scores as if they were per-league.
  const [showWideData, setShowWideData] = useState(null);
  useEffect(() => {
    if (!rawSelected?.useShowWideScoring) { setShowWideData(null); return; }
    const showType = rawSelected.showType;
    const seasonKey = getShowSeasonKey(rawSelected);
    if (!showType || !seasonKey) { setShowWideData(null); return; }
    let cancelled = false;
    (async () => {
      const data = await loadData(`showScoring/${showType}/${seasonKey}`, null);
      if (!cancelled) setShowWideData(data || null);
    })();
    return () => { cancelled = true; };
  }, [rawSelected?.id, rawSelected?.useShowWideScoring, rawSelected?.showType, rawSelected?.seasonNumber]);
  const selected = useMemo(
    () => rawSelected?.useShowWideScoring ? mergeShowWideScoring(rawSelected, showWideData) : rawSelected,
    [rawSelected, showWideData]
  );
  const myTeamIn = (lid) => userProfile?.activations?.[lid] || null;
  const visibleLeagues = isAdmin ? leagues : leagues.filter(l => userProfile?.activations?.[l.id] || l.commissionerUid === authUser?.uid);

  if (authLoading) {
    return (
      <div style={{ minHeight:"100vh",background:"#0d0d1a",display:"flex",alignItems:"center",justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:40,height:40}}>
              <rect x="3" y="5" width="26" height="18" rx="3" stroke="#ff4d6a" strokeWidth="2.5" fill="none"/>
              <line x1="11" y1="27" x2="21" y2="27" stroke="#7a7a9a" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="16" y1="23" x2="16" y2="27" stroke="#7a7a9a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M13 10 L13 16 Q16 19 19 16 L19 10 Z" fill="#ffd23d" opacity="0.85"/>
              <path d="M11 10.5 Q11 13 13 13" stroke="#ff8a3d" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M21 10.5 Q21 13 19 13" stroke="#ff8a3d" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          <div style={{ color:"#e8e8f0",fontSize:16,fontWeight:700,fontFamily:"'Anybody',sans-serif" }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh",background:"#0d0d1a",fontFamily:"'Outfit',sans-serif",padding:"0" }}>
      <style>{`
        body { margin:0; background:#0d0d1a; }
        input:focus,select:focus{border-color:#e94560!important;outline:none}
        select{background-color:#0d0d18!important;color:#e8e8f0!important}
        option{background:#0d0d18!important;color:#e8e8f0!important}
        optgroup{background:#1a1a30!important;color:#8888aa!important;font-style:normal}
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .fade-in { animation: fadeIn 0.3s ease; }
        @media (min-width: 768px) {
          body { padding: 20px; }
          .app-root { max-width: 720px; margin: 0 auto; }
        }
        @media (min-width: 1024px) {
          .app-root { max-width: 900px; }
        }
      `}</style>
      {view==="login" && <AuthScreen onJoinViaCode={handleJoinViaCode} pendingJoinCode={pendingJoinCode} />}
      {view==="settings" && authUser && <UserSettingsScreen user={authUser} onBack={()=>setView("home")} onLogout={handleLogout} userProfile={userProfile} onUpdateProfile={async (updated) => { await saveUserProfile(authUser.uid, updated); setUserProfile(updated); }} />}
      {view==="faq" && <FAQPage onBack={()=>setView(authUser?"home":"login")} />}
      {view==="admin" && isAdmin && <AdminPanel leagues={leagues} onBack={()=>setView("home")} onUpdate={persist} featureFlags={featureFlags} setFeatureFlags={setFeatureFlags} />}
      {view==="home" && authUser && <AppHome
        user={authUser} profile={userProfile} leagues={visibleLeagues}
        isAdmin={isAdmin} onSelectLeague={id=>{setSelectedId(id);setView("league")}}
        onCreateLeague={()=>setView("create")} onDeleteLeague={deleteLeague} onDuplicateLeague={duplicateLeague}
        onLogout={handleLogout}
        onOpenSettings={()=>setView("settings")}
        onJoinViaCode={handleJoinViaCode}
        onOpenAdmin={()=>setView("admin")}
        announcement={announcement}
        pendingJoinCode={pendingJoinCode}
        allLeaguesCount={leagues.filter(l => l.commissionerUid === authUser?.uid).length} />}
      {view==="create" && <CreateLeagueScreen commissionerUid={authUser?.uid} featureFlags={featureFlags} onSave={async l=>{ await persist([...leagues,l]); setSelectedId(l.id);setView("league"); }} onCancel={()=>setView("home")} />}
      {view==="league" && selected && authUser && <LeagueDashboard league={selected} allLeagues={leagues}
        onUpdate={u=>{
          let updated = leagues.map(l=>l.id===u.id?u:l);
          if (u.linkedLeagueId) {
            updated = updated.map(l => l.id === u.linkedLeagueId ? {
              ...l, weeklyScores: u.weeklyScores,
              contestants: l.contestants.map(lc => { const uc = (u.contestants||[]).find(c => c.id === lc.id); return uc ? { ...lc, status: uc.status, eliminatedWeek: uc.eliminatedWeek, tribe: uc.tribe } : lc; }),
              currentWeek: u.currentWeek, tribes: u.tribes || l.tribes,
              merged: u.merged !== undefined ? u.merged : l.merged, mergedTribeName: u.mergedTribeName || l.mergedTribeName,
            } : l);
          }
          updated = updated.map(l => {
            if (l.id !== u.id && l.linkedLeagueId === u.id) {
              return { ...l, weeklyScores: u.weeklyScores,
                contestants: l.contestants.map(lc => { const uc = (u.contestants||[]).find(c => c.id === lc.id); return uc ? { ...lc, status: uc.status, eliminatedWeek: uc.eliminatedWeek, tribe: uc.tribe } : lc; }),
                currentWeek: u.currentWeek, tribes: u.tribes || l.tribes,
                merged: u.merged !== undefined ? u.merged : l.merged, mergedTribeName: u.mergedTribeName || l.mergedTribeName,
              };
            }
            return l;
          });
          persistLeague(u, updated);
        }}
        onBack={()=>{refreshLeagues();setView("home")}}
        loggedInTeamId={(isAdmin || selected?.commissionerUid === authUser?.uid) ? (selected.adminTeamId || myTeamIn(selected.id)) : myTeamIn(selected.id)}
        isCommissioner={isAdmin || selected?.commissionerUid === authUser?.uid || (selected?.commissionerTeamId && userProfile?.activations?.[selected.id] === selected.commissionerTeamId)}
        userProfile={userProfile}
        onRevealSpoiler={handleRevealSpoiler}
        />}
      {pendingJoin && <JoinConfirmModal
        pendingJoin={pendingJoin}
        onConfirm={confirmJoin}
        onCancel={() => { setPendingJoin(null); setPendingJoinCode(""); setConfirmJoinError(""); }}
        displayName={userProfile?.displayName || authUser?.email?.split("@")[0] || "Player"}
        error={confirmJoinError}
      />}
    </div>
  );
}


// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ACCOUNT INFO (editable display name)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AccountInfoSection({ user, userProfile, onUpdateProfile }) {
  const [editingName, setEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user?.displayName || "");
  return (
    <div style={{ padding:"16px",background:"#12121f",borderRadius:12,border:"1px solid #1e1e38",marginBottom:16 }}>
      <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:8 }}>Account</div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #1a1a30" }}>
        <span style={{ color:"#6a6a8a",fontSize:12 }}>Email</span>
        <span style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>{user?.email}</span>
      </div>
      <div style={{ fontSize:10,color:"#4a4a6a",padding:"4px 0 8px",borderBottom:"1px solid #1a1a30" }}>
        Contact admin@fantasyrealitytv.com to change your email.
      </div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8 }}>
        <span style={{ color:"#6a6a8a",fontSize:12 }}>Display name</span>
        {editingName ? (
          <div style={{ display:"flex",gap:6,alignItems:"center" }}>
            <input value={newDisplayName} onChange={e=>setNewDisplayName(e.target.value)}
              style={{ padding:"4px 8px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,color:"#e8e8f0",fontSize:13,fontFamily:"'Outfit',sans-serif",width:160 }} />
            <Btn small onClick={async ()=>{
              if (!newDisplayName.trim()) return;
              const { updateProfile } = await import('firebase/auth');
              const { getAuth } = await import('firebase/auth');
              await updateProfile(getAuth().currentUser, { displayName: newDisplayName.trim() });
              await onUpdateProfile({ ...userProfile, displayName: newDisplayName.trim() });
              setEditingName(false);
            }}>Save</Btn>
            <Btn small variant="ghost" onClick={()=>{setNewDisplayName(user?.displayName||"");setEditingName(false)}}>Cancel</Btn>
          </div>
        ) : (
          <div style={{ display:"flex",alignItems:"center",gap:6 }}>
            <span style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>{user?.displayName || "Not set"}</span>
            <button onClick={()=>setEditingName(true)} style={{ background:"none",border:"none",color:"#4ecdc4",cursor:"pointer",fontSize:11 }}>Edit</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USER SETTINGS SCREEN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function UserSettingsScreen({ user, onBack, onLogout, userProfile, onUpdateProfile }) {
  return (
    <div style={{ padding:20 }}>
      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:24 }}>
        <button onClick={onBack} style={{ background:"#12121f",border:"1px solid #1e1e38",borderRadius:8,color:"#8888aa",cursor:"pointer",padding:6,display:"flex",alignItems:"center",justifyContent:"center" }}><Icon name="back" size={18}/></button>
        <h2 style={{ margin:0,fontSize:20,fontFamily:"'Anybody',sans-serif",fontWeight:800,color:"#e8e8f0" }}>My Account</h2>
      </div>

      {/* Account info */}
      <AccountInfoSection user={user} userProfile={userProfile} onUpdateProfile={onUpdateProfile} />

      {/* Spoiler Protection */}
      {userProfile && onUpdateProfile && (
        <label style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 14px",
          background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",cursor:"pointer",marginBottom:16 }}>
          <input type="checkbox" checked={!userProfile?.spoilerProtectionOff}
            onChange={async (e) => {
              await onUpdateProfile({ ...userProfile, spoilerProtectionOff: !e.target.checked });
            }}
            style={{ accentColor:"#e94560",width:32,height:32 }} />
          <div>
            <div style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>Spoiler Protection</div>
            <div style={{ color:"#6a6a8a",fontSize:11,marginTop:2 }}>
              Blur scores and results until you choose to reveal them after each episode
            </div>
          </div>
        </label>
      )}

      {/* Actions */}
      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
        <Btn variant="ghost" onClick={onLogout} style={{ justifyContent:"center" }}>Log Out</Btn>
        <Btn variant="danger" onClick={async ()=>{
          if (!confirm("Delete your account? This removes your profile and all team links. Your teams stay in leagues but become unassigned. This cannot be undone.")) return;
          const final = prompt("Type DELETE to permanently delete your account:");
          if (final !== "DELETE") return;
          try {
            await deleteUserProfile(user.uid);
            await deleteAuthAccount();
          } catch(e) { alert("Error: " + e.message + ". You may need to log out and log back in first, then try again."); }
        }} style={{ justifyContent:"center" }}>Delete My Account</Btn>
      </div>

      <div style={{ marginTop:20,padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
        <div style={{ fontSize:12,color:"#6a6a8a",lineHeight:1.5 }}>
          Need help? Contact <a href="mailto:admin@fantasyrealitytv.com" style={{color:"#4ecdc4"}}>admin@fantasyrealitytv.com</a>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FAQ PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function FAQPage({ onBack }) {
  const [openId, setOpenId] = useState(null);

  const faqs = [
    { id: "what", q: "What is Fantasy Reality TV?",
      a: "It's like fantasy football, but for reality TV. You draft contestants from shows like Survivor, Top Chef, and Love Island, earn points based on what happens each episode, and compete against your friends all season long." },
    { id: "free", q: "Is it free?",
      a: "Yes, completely free to play. Create a league, invite friends, and start drafting." },
    { id: "start", q: "How do I start a league?",
      a: "Sign up, tap 'New League' on the home screen, pick your show, and name your league. Then generate invite codes for your friends from the Teams tab." },
    { id: "join", q: "How do I join a friend's league?",
      a: "Get an invite code from your league's commissioner. You can enter it when you sign up (on the 'Join League' tab) or after logging in on the home screen." },
    { id: "formats", q: "What league formats are available?",
      a: "Two formats right now: Heroes format (one-time draft with Hero 2× and Side-Kick 1.5× multipliers, one swap per week) and Standard format (weekly snake redraft in inverse standings order). More formats coming soon." },
    { id: "scoring", q: "How does scoring work?",
      a: "Your league's commissioner scores each episode. They pick which events happened (challenge wins, eliminations, drama moments, etc.) and assign them to contestants. Points are customizable — your league decides what's worth what." },
    { id: "commissioner", q: "What does a commissioner do?",
      a: "The commissioner is the person who runs the league. They score episodes, manage settings, generate invite codes, lock rosters before episodes, and handle any league drama. Whoever creates the league is automatically the commissioner." },
    { id: "roster", q: "How do I set my roster?",
      a: "Go to your league and tap the 'My Roster' tab. Pick contestants for each slot using the dropdown. Your commissioner may lock rosters before episodes air, so set yours early." },
    { id: "shows", q: "What shows can I play?",
      a: "We have pre-built scoring templates for Survivor, Top Chef, Love Island, The Bachelor/ette, and Great British Bake Off. You can also create a custom league for any show with a cast and eliminations." },
    { id: "multiple", q: "Can I be in multiple leagues?",
      a: "Absolutely. You can be in as many leagues as you want, and you can create up to 3 leagues of your own." },
    { id: "phone", q: "Is there a mobile app?",
      a: "The site works as a Progressive Web App (PWA). On your phone, open the site in your browser, then use 'Add to Home Screen' to install it. It'll look and feel like a native app." },
  ];

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:24 }}>
        <button onClick={onBack} style={{ background:"none",border:"none",color:"#8888aa",cursor:"pointer",padding:4 }}><Icon name="back" size={20}/></button>
        <h2 style={{ margin:0,fontSize:20,fontFamily:"'Anybody',sans-serif",fontWeight:800,color:"#e8e8f0" }}>FAQ</h2>
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
        {faqs.map(f => (
          <div key={f.id} style={{ background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",overflow:"hidden" }}>
            <button onClick={()=>setOpenId(openId===f.id?null:f.id)} style={{
              width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"14px 16px",background:"none",border:"none",cursor:"pointer",textAlign:"left",
              fontFamily:"'Outfit',sans-serif",
            }}>
              <span style={{ color:"#e8e8f0",fontSize:14,fontWeight:600,flex:1,paddingRight:12 }}>{f.q}</span>
              <span style={{ color:"#6a6a8a",fontSize:16,transform:openId===f.id?"rotate(45deg)":"none",transition:"transform .2s" }}>+</span>
            </button>
            {openId===f.id && (
              <div style={{ padding:"0 16px 14px",fontSize:13,color:"#8888aa",lineHeight:1.65 }}>{f.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN PANEL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// v2.6.2.0: Admin Shows tab — fully editable. Base rules and library add-ons
// are RTDB-backed at `scoringRuleLibrary/<showType>/<ruleId>` and override the
// compiled-in `DEFAULT_SCORING_RULES` at read time. Custom rules (not in
// DEFAULT_SCORING_RULES) live alongside overrides and appear in every league's
// library picker. Per-league rule edits (in ScoringRulesSection) still win as
// the most-specific override layer.
function AdminShowsTab() {
  const [selectedShow, setSelectedShow] = useState("survivor");
  const [overrides, setOverrides] = useState({}); // { [ruleId]: { label, points, category, description, isElimination, _custom? } }
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [newRule, setNewRule] = useState({ id:"", label:"", points:0, category:"Custom", description:"" });

  const preset = SHOW_PRESETS[selectedShow] || {};
  const presetIds = new Set(preset.scoringDefaults || []);
  const presetRules = DEFAULT_SCORING_RULES.filter(r => presetIds.has(r.id));

  // Load overrides for the selected show whenever it changes.
  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    (async () => {
      const data = await loadData("scoringRuleLibrary/" + selectedShow, {});
      if (!cancelled) {
        setOverrides(data || {});
        setLoaded(true);
        setSavedAt(null);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedShow]);

  // Compute the merged view: presetRules with overrides applied, plus pure-
  // custom rules (no preset row). Custom rules show first so they're visible.
  const mergedRules = useMemo(() => {
    const result = [];
    Object.entries(overrides).forEach(([rid, ov]) => {
      if (ov?._custom) result.push({ id: rid, ...ov });
    });
    presetRules.forEach(r => {
      const ov = overrides[r.id] || {};
      result.push({
        ...r,
        ...ov,
        id: r.id,
        _isPresetBase: true,
        _overridden: Object.keys(ov).length > 0 && !ov._custom,
      });
    });
    return result;
  }, [presetRules, overrides]);

  function patchRule(ruleId, patch) {
    setOverrides(prev => {
      const existing = prev[ruleId] || {};
      const isPreset = presetIds.has(ruleId);
      const baseDefault = isPreset ? DEFAULT_SCORING_RULES.find(r => r.id === ruleId) : null;
      const next = { ...existing, ...patch };
      // For preset rules, only store fields that DIFFER from the compiled default —
      // so an unmodified rule has no override entry and can pick up future default
      // tweaks. For custom rules, store everything.
      if (isPreset && baseDefault) {
        const trimmed = {};
        ["label","points","category","description","isElimination"].forEach(k => {
          if (k in next && next[k] !== undefined && next[k] !== baseDefault[k]) trimmed[k] = next[k];
        });
        if (Object.keys(trimmed).length === 0) {
          const { [ruleId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [ruleId]: trimmed };
      }
      return { ...prev, [ruleId]: next };
    });
  }

  function deleteCustomRule(ruleId) {
    if (!confirm(`Remove custom rule "${overrides[ruleId]?.label || ruleId}" from the ${preset.name} library?`)) return;
    setOverrides(prev => { const { [ruleId]: _, ...rest } = prev; return rest; });
  }

  function resetPresetRule(ruleId) {
    setOverrides(prev => { const { [ruleId]: _, ...rest } = prev; return rest; });
  }

  function addCustomRule() {
    const label = newRule.label.trim();
    if (!label) return;
    const baseId = "lib_" + selectedShow + "_" + label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/,"");
    let id = baseId; let n = 2;
    while (overrides[id] || presetIds.has(id)) { id = `${baseId}_${n++}`; }
    setOverrides(prev => ({ ...prev, [id]: {
      _custom: true,
      label,
      points: Number(newRule.points) || 0,
      category: newRule.category.trim() || "Custom",
      description: newRule.description.trim() || undefined,
    }}));
    setNewRule({ id:"", label:"", points:0, category:"Custom", description:"" });
  }

  async function saveAll() {
    setSaving(true);
    await saveData("scoringRuleLibrary/" + selectedShow, overrides);
    setSavedAt(Date.now());
    setSaving(false);
  }

  return (
    <div>
      <div style={{ marginBottom:16,padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
        <div style={{ fontSize:11,fontWeight:700,color:"#f5a623",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em" }}>Show-Wide Rule Library</div>
        <div style={{ fontSize:12,color:"#8888aa",lineHeight:1.6 }}>
          Edit a show's base rules or add new library entries. Changes go to RTDB at <code style={{color:"#aaaabf",fontSize:11}}>scoringRuleLibrary/{selectedShow}</code> and merge into every league's "Add from Library" picker plus the seed values when a new league of this show is created. Each league can still override label/points/description per-league in Settings &rsaquo; Scoring Rules — those wins as the most-specific layer.
        </div>
      </div>

      <Select label="Show" value={selectedShow} onChange={e=>setSelectedShow(e.target.value)} options={
        Object.entries(SHOW_PRESETS).map(([id, p]) => ({ value: id, label: p.name }))
      } />

      <div style={{ marginBottom:20,padding:"14px 16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0" }}>Rules &middot; {preset.name}</div>
            <div style={{ fontSize:11,color:"#6a6a8a",marginTop:2 }}>{mergedRules.length} rule{mergedRules.length!==1?"s":""} ({presetRules.length} preset + {mergedRules.length - presetRules.length} custom)</div>
          </div>
          <div style={{ display:"flex",gap:8,alignItems:"center" }}>
            {savedAt && <span style={{ fontSize:11,color:"#4ecdc4" }}>Saved</span>}
            <Btn small onClick={saveAll} disabled={saving || !loaded}>{saving?"Saving...":"Save changes"}</Btn>
          </div>
        </div>
        {!loaded ? (
          <div style={{ padding:"20px",textAlign:"center",color:"#6a6a8a",fontSize:13 }}>Loading...</div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:6,maxHeight:480,overflowY:"auto" }}>
            {mergedRules.map(r => (
              <div key={r.id} style={{ padding:"10px 12px",background:"#0d0d18",borderRadius:8,border:r._overridden||r._custom?"1px solid #f5a62333":"1px solid #1e1e38" }}>
                <div style={{ display:"flex",gap:6,alignItems:"center",marginBottom:6 }}>
                  <input value={r.label || ""} onChange={e=>patchRule(r.id, { label: e.target.value })} placeholder="Label" style={{ flex:1,padding:"6px 10px",background:"#12121f",border:"1px solid #2a2a4a",borderRadius:6,color:"#e8e8f0",fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none",minWidth:0 }} />
                  <input value={r.category || ""} onChange={e=>patchRule(r.id, { category: e.target.value })} placeholder="Category" style={{ width:110,padding:"6px 10px",background:"#12121f",border:"1px solid #2a2a4a",borderRadius:6,color:"#8888aa",fontSize:11,fontFamily:"'Outfit',sans-serif",outline:"none" }} />
                  <input type="number" step="0.5" value={r.points ?? 0} onChange={e=>patchRule(r.id, { points: Number(e.target.value) })} style={{ width:64,padding:"6px 10px",background:"#12121f",border:"1px solid #2a2a4a",borderRadius:6,color:r.points>=0?"#4ecdc4":"#e94560",fontSize:12,fontWeight:700,fontFamily:"'Outfit',sans-serif",outline:"none",textAlign:"right" }} />
                  {r._custom ? (
                    <button onClick={()=>deleteCustomRule(r.id)} title="Remove custom rule" style={{ background:"none",border:"1px solid #2a2a4a",borderRadius:6,color:"#e94560",width:28,height:28,cursor:"pointer",fontSize:14,flexShrink:0 }}>&times;</button>
                  ) : r._overridden ? (
                    <button onClick={()=>resetPresetRule(r.id)} title="Reset to preset default" style={{ background:"none",border:"1px solid #2a2a4a",borderRadius:6,color:"#8888aa",height:28,padding:"0 8px",cursor:"pointer",fontSize:10,flexShrink:0,fontFamily:"'Outfit',sans-serif" }}>Reset</button>
                  ) : (
                    <div style={{ width:28 }}/>
                  )}
                </div>
                <textarea value={r.description || ""} onChange={e=>patchRule(r.id, { description: e.target.value })} placeholder="Description (shown to players in Scoring tab)" rows={2} style={{ width:"100%",padding:"6px 10px",background:"#12121f",border:"1px solid #2a2a4a",borderRadius:6,color:"#aaaabf",fontSize:11,fontFamily:"'Outfit',sans-serif",outline:"none",resize:"vertical",boxSizing:"border-box",lineHeight:1.4 }} />
                {(r._custom || r._overridden) && (
                  <div style={{ marginTop:4,display:"flex",gap:6,alignItems:"center" }}>
                    {r._custom && <Badge color="#9d5dff">Custom</Badge>}
                    {r._overridden && <Badge color="#f5a623">Override</Badge>}
                    {r.isElimination && <Badge color="#e94560">Elimination</Badge>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom:20,padding:"14px 16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
        <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:10 }}>Add Custom Rule</div>
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          <input value={newRule.label} onChange={e=>setNewRule(s=>({...s, label: e.target.value}))} placeholder="Rule label (e.g. 'Kissed by the Bombshell')" style={{ padding:"8px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,color:"#e8e8f0",fontSize:13,fontFamily:"'Outfit',sans-serif",outline:"none" }} />
          <div style={{ display:"flex",gap:8 }}>
            <input type="number" step="0.5" value={newRule.points} onChange={e=>setNewRule(s=>({...s, points: e.target.value}))} placeholder="Points" style={{ width:90,padding:"8px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,color:"#e8e8f0",fontSize:13,fontFamily:"'Outfit',sans-serif",outline:"none" }} />
            <input value={newRule.category} onChange={e=>setNewRule(s=>({...s, category: e.target.value}))} placeholder="Category" style={{ flex:1,padding:"8px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,color:"#e8e8f0",fontSize:13,fontFamily:"'Outfit',sans-serif",outline:"none" }} />
          </div>
          <textarea value={newRule.description} onChange={e=>setNewRule(s=>({...s, description: e.target.value}))} placeholder="Description (optional)" rows={2} style={{ width:"100%",padding:"8px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,color:"#aaaabf",fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none",resize:"vertical",boxSizing:"border-box" }} />
          <div style={{ display:"flex",justifyContent:"flex-end" }}>
            <Btn small onClick={addCustomRule} disabled={!newRule.label.trim()}>+ Add to {preset.name} library</Btn>
          </div>
        </div>
      </div>

      <ShowCastSection selectedShow={selectedShow} />
      <ShowWideScoringSection selectedShow={selectedShow} mergedRules={mergedRules} />
    </div>
  );
}

// v2.6.6.0: admin-managed show cast per (show, season). Commissioners pull
// from this into their league.contestants with one click — addresses the
// "set up 20 contestants manually for each league" pain point. Persists at
// RTDB `showCast/<showType>/season_<N>/contestants[]`.
function ShowCastSection({ selectedShow }) {
  const [seasonNumber, setSeasonNumber] = useState("");
  const [castList, setCastList] = useState([]); // [{ id, name, photoUrl, gender, tribe }]
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [newName, setNewName] = useState("");

  const seasonKey = seasonNumber ? `season_${seasonNumber}` : "";

  useEffect(() => {
    if (!seasonKey) { setCastList([]); setLoaded(true); return; }
    let cancelled = false;
    setLoaded(false);
    (async () => {
      const data = await loadData(`showCast/${selectedShow}/${seasonKey}`, null);
      if (cancelled) return;
      setCastList(Array.isArray(data?.contestants) ? data.contestants : []);
      setLoaded(true);
      setSavedAt(null);
    })();
    return () => { cancelled = true; };
  }, [selectedShow, seasonKey]);

  function addContestant() {
    const n = newName.trim();
    if (!n) return;
    if (castList.some(c => c.name.toLowerCase() === n.toLowerCase())) return;
    const id = "sc_" + Date.now().toString(36) + Math.random().toString(36).slice(2,6);
    setCastList(prev => [...prev, { id, name: n, photoUrl: "", gender: "", tribe: "" }]);
    setNewName("");
  }
  function updateContestant(id, patch) {
    setCastList(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }
  function removeContestant(id) {
    setCastList(prev => prev.filter(c => c.id !== id));
  }
  async function saveAll() {
    if (!seasonKey) return;
    setSaving(true);
    await saveData(`showCast/${selectedShow}/${seasonKey}`, { contestants: castList });
    setSavedAt(Date.now());
    setSaving(false);
  }

  return (
    <div style={{ marginBottom:20,padding:"14px 16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:8,flexWrap:"wrap" }}>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0" }}>Show Cast</div>
          <div style={{ fontSize:11,color:"#6a6a8a",marginTop:2 }}>One cast list per season &mdash; commissioners import into their leagues</div>
        </div>
        {savedAt && <span style={{ fontSize:11,color:"#4ecdc4" }}>Saved</span>}
        <Btn small onClick={saveAll} disabled={saving || !seasonKey}>{saving?"Saving...":"Save"}</Btn>
      </div>

      <div style={{ marginBottom:12,maxWidth:200 }}>
        <Select label="Season #" value={seasonNumber} onChange={e=>setSeasonNumber(e.target.value)} options={[
          { value: "", label: "— Pick a season —" },
          ...Array.from({length: 60}, (_, i) => ({ value: String(i+1), label: `Season ${i+1}` })),
        ]} />
      </div>

      {!seasonKey ? (
        <div style={{ padding:"14px",textAlign:"center",background:"#0d0d18",borderRadius:8,border:"1px dashed #2a2a4a",color:"#8888aa",fontSize:12,lineHeight:1.6 }}>
          Pick a season number to manage the cast. Leagues with the same Season # see an Import Cast button on their Cast tab.
        </div>
      ) : !loaded ? (
        <div style={{ padding:"20px",textAlign:"center",color:"#6a6a8a",fontSize:13 }}>Loading...</div>
      ) : (
        <>
          <div style={{ display:"flex",gap:6,marginBottom:10 }}>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Contestant name" onKeyDown={e=>{if(e.key==="Enter")addContestant()}} style={{ flex:1,padding:"8px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,color:"#e8e8f0",fontSize:13,fontFamily:"'Outfit',sans-serif",outline:"none" }} />
            <Btn small onClick={addContestant} disabled={!newName.trim()}>+ Add</Btn>
          </div>
          {castList.length === 0 ? (
            <div style={{ padding:"14px",textAlign:"center",color:"#6a6a8a",fontSize:12,background:"#0d0d18",borderRadius:8,border:"1px dashed #2a2a4a" }}>
              No contestants yet. Add names above.
            </div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:8,maxHeight:480,overflowY:"auto" }}>
              {castList.map(c => (
                <div key={c.id} style={{ padding:"10px 12px",background:"#0d0d18",borderRadius:8,border:"1px solid #1e1e38" }}>
                  <div style={{ display:"flex",gap:6,alignItems:"center",marginBottom:6 }}>
                    <input value={c.name} onChange={e=>updateContestant(c.id, { name: e.target.value })} style={{ flex:1,padding:"6px 10px",background:"#12121f",border:"1px solid #2a2a4a",borderRadius:6,color:"#e8e8f0",fontSize:12,fontFamily:"'Outfit',sans-serif",outline:"none",minWidth:0 }} />
                    <select value={c.gender || ""} onChange={e=>updateContestant(c.id, { gender: e.target.value })} style={{ width:80,padding:"6px 8px",background:"#12121f",border:"1px solid #2a2a4a",borderRadius:6,color:"#8888aa",fontSize:11,fontFamily:"'Outfit',sans-serif",outline:"none" }}>
                      <option value="">—</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <input value={c.tribe || ""} onChange={e=>updateContestant(c.id, { tribe: e.target.value })} placeholder="Tribe (opt)" style={{ width:100,padding:"6px 10px",background:"#12121f",border:"1px solid #2a2a4a",borderRadius:6,color:"#8888aa",fontSize:11,fontFamily:"'Outfit',sans-serif",outline:"none" }} />
                    <button onClick={()=>removeContestant(c.id)} title="Remove" style={{ background:"none",border:"1px solid #2a2a4a",borderRadius:6,color:"#e94560",width:28,height:28,cursor:"pointer",fontSize:14,flexShrink:0 }}>&times;</button>
                  </div>
                  <input value={c.photoUrl || ""} onChange={e=>updateContestant(c.id, { photoUrl: e.target.value })} placeholder="Photo URL (optional)" style={{ width:"100%",padding:"6px 10px",background:"#12121f",border:"1px solid #2a2a4a",borderRadius:6,color:"#aaaabf",fontSize:11,fontFamily:"'Outfit',sans-serif",outline:"none",boxSizing:"border-box" }} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// v2.6.3.0: Show-Wide Episode Scoring — real MVP. Admin scores events against
// contestant names per show + season + episode. Stored at RTDB
// `showScoring/<showType>/<seasonKey>/<episode>/<contestantName>/<ruleId>` = count.
// Leagues with `useShowWideScoring: true` and a matching seasonName pick up
// the events at render time (see mergeShowWideScoring in App.jsx). Name match
// is case-insensitive trim — if league contestant names diverge from what
// admin types here, they won't match; the commissioner can rename their
// league's contestants to align.
function ShowWideScoringSection({ selectedShow, mergedRules }) {
  // v2.6.5.0: structured numeric Season # to match the league-side selector.
  // Avoids string mismatches that silently drop events.
  const [seasonNumber, setSeasonNumber] = useState("");
  const [episode, setEpisode] = useState("1");
  const [contestants, setContestants] = useState([]); // [{ name, scores: {ruleId: count} }]
  const [newName, setNewName] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const seasonKey = seasonNumber ? `season_${seasonNumber}` : "";

  // Load events for selected season + episode
  useEffect(() => {
    if (!seasonKey) { setContestants([]); setLoaded(true); return; }
    let cancelled = false;
    setLoaded(false);
    (async () => {
      const data = await loadData(`showScoring/${selectedShow}/${seasonKey}/${episode}`, {});
      if (cancelled) return;
      const list = Object.entries(data || {}).map(([name, scores]) => ({ name, scores: scores || {} }));
      setContestants(list);
      setLoaded(true);
      setSavedAt(null);
    })();
    return () => { cancelled = true; };
  }, [selectedShow, seasonKey, episode]);

  function addContestant() {
    const n = newName.trim();
    if (!n) return;
    if (contestants.some(c => c.name.toLowerCase() === n.toLowerCase())) return;
    setContestants(prev => [...prev, { name: n, scores: {} }]);
    setNewName("");
  }
  function removeContestant(name) {
    setContestants(prev => prev.filter(c => c.name !== name));
  }
  function setCount(name, ruleId, count) {
    setContestants(prev => prev.map(c => c.name !== name ? c : {
      ...c,
      scores: { ...c.scores, [ruleId]: Math.max(0, Number(count) || 0) },
    }));
  }

  async function saveAll() {
    if (!seasonKey) return;
    setSaving(true);
    // Build the payload object: { [contestantName]: { [ruleId]: count } }
    const payload = {};
    contestants.forEach(c => {
      const trimmed = {};
      Object.entries(c.scores || {}).forEach(([rid, n]) => {
        if (Number(n) > 0) trimmed[rid] = Number(n);
      });
      if (Object.keys(trimmed).length > 0) payload[c.name] = trimmed;
    });
    await saveData(`showScoring/${selectedShow}/${seasonKey}/${episode}`, payload);
    setSavedAt(Date.now());
    setSaving(false);
  }

  return (
    <div style={{ marginBottom:20,padding:"14px 16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,gap:8,flexWrap:"wrap" }}>
        <div style={{ flex:1,minWidth:0 }}>
          <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0" }}>Show-Wide Episode Scoring</div>
          <div style={{ fontSize:11,color:"#6a6a8a",marginTop:2 }}>Score events once; opted-in leagues consume at render time</div>
        </div>
        {savedAt && <span style={{ fontSize:11,color:"#4ecdc4" }}>Saved</span>}
        <Btn small onClick={saveAll} disabled={saving || !seasonKey}>{saving?"Saving...":"Save"}</Btn>
      </div>

      <div style={{ display:"flex",gap:8,marginBottom:12 }}>
        <div style={{ flex:2 }}>
          <Select label="Season #" value={seasonNumber} onChange={e=>setSeasonNumber(e.target.value)} options={[
            { value: "", label: "— Pick a season —" },
            ...Array.from({length: 60}, (_, i) => ({ value: String(i+1), label: `Season ${i+1}` })),
          ]} />
        </div>
        <div style={{ flex:1 }}>
          <Input label="Episode" type="number" min="1" value={episode} onChange={e=>setEpisode(String(Number(e.target.value) || 1))} />
        </div>
      </div>

      {!seasonKey ? (
        <div style={{ padding:"14px",textAlign:"center",background:"#0d0d18",borderRadius:8,border:"1px dashed #2a2a4a",color:"#8888aa",fontSize:12,lineHeight:1.6 }}>
          Pick a season number to start scoring. Leagues opt in via Settings &rsaquo; Roster &rsaquo; "Use show-wide scoring" and match by their own structured <code style={{color:"#aaaabf"}}>seasonNumber</code> — no string fuzziness.
        </div>
      ) : !loaded ? (
        <div style={{ padding:"20px",textAlign:"center",color:"#6a6a8a",fontSize:13 }}>Loading...</div>
      ) : (
        <>
          <div style={{ display:"flex",gap:6,marginBottom:10 }}>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Contestant name (matches across leagues by name)" onKeyDown={e=>{if(e.key==="Enter")addContestant()}} style={{ flex:1,padding:"8px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,color:"#e8e8f0",fontSize:13,fontFamily:"'Outfit',sans-serif",outline:"none" }} />
            <Btn small onClick={addContestant} disabled={!newName.trim()}>+ Add</Btn>
          </div>
          {contestants.length === 0 ? (
            <div style={{ padding:"14px",textAlign:"center",color:"#6a6a8a",fontSize:12,background:"#0d0d18",borderRadius:8,border:"1px dashed #2a2a4a" }}>
              No contestants yet for episode {episode}. Add names above.
            </div>
          ) : (
            <div style={{ display:"flex",flexDirection:"column",gap:10,maxHeight:480,overflowY:"auto" }}>
              {contestants.map(c => (
                <div key={c.name} style={{ padding:"10px 12px",background:"#0d0d18",borderRadius:8,border:"1px solid #1e1e38" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                    <div style={{ fontSize:13,fontWeight:700,color:"#e8e8f0" }}>{c.name}</div>
                    <button onClick={()=>removeContestant(c.name)} title="Remove" style={{ background:"none",border:"1px solid #2a2a4a",borderRadius:6,color:"#e94560",height:24,padding:"0 8px",cursor:"pointer",fontSize:11,fontFamily:"'Outfit',sans-serif" }}>Remove</button>
                  </div>
                  <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                    {mergedRules.map(r => {
                      const count = Number(c.scores?.[r.id]) || 0;
                      return (
                        <div key={r.id} style={{ display:"flex",alignItems:"center",gap:8 }}>
                          <div style={{ flex:1,minWidth:0 }}>
                            <div style={{ color:count>0?"#e8e8f0":"#6a6a8a",fontSize:12,fontWeight:600 }}>{r.label}</div>
                            <div style={{ color:r.points>=0?"#4ecdc4":"#e94560",fontSize:10 }}>{r.points>=0?"+":""}{r.points} pts &middot; default for this show</div>
                          </div>
                          <button onClick={()=>setCount(c.name, r.id, Math.max(0, count-1))} disabled={count===0} style={{ background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:6,color:"#8888aa",width:24,height:24,cursor:count===0?"not-allowed":"pointer",fontSize:14,opacity:count===0?0.4:1 }}>&minus;</button>
                          <span style={{ minWidth:24,textAlign:"center",fontWeight:700,fontSize:13,color:count>0?"#4ecdc4":"#6a6a8a",fontFamily:"'Anybody',sans-serif" }}>{count}</span>
                          <button onClick={()=>setCount(c.name, r.id, count+1)} style={{ background:"#1a1a30",border:"1px solid #2a2a4a",borderRadius:6,color:"#4ecdc4",width:24,height:24,cursor:"pointer",fontSize:14 }}>+</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <div style={{ marginTop:10,fontSize:10,color:"#6a6a8a",fontStyle:"italic",lineHeight:1.4 }}>
        Each league applies its OWN point value to these counts (the rule's points in <em>that</em> league's <code style={{color:"#aaaabf"}}>scoringRules</code>, not the default shown here). Name match is case-insensitive trim — contestant names in opted-in leagues need to match what's typed here.
      </div>
    </div>
  );
}

function AdminPanel({ leagues, onBack, onUpdate, featureFlags, setFeatureFlags }) {
  const [tab, setTab] = useState("stats");
  const [users, setUsers] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [savedAnnouncement, setSavedAnnouncement] = useState("");

  // v2.6.5.0: parent-level read of `frtv_users` requires the v2.6.3.0 rules
  // deploy. Until that lands, fall back to reading commissioner UIDs from
  // every league + the current admin's uid individually (those READS are
  // allowed by the existing per-uid rule). Approximates the user count from
  // what we can see; once rules deploy, the collection read returns the
  // accurate full set.
  const [userCountFallbackUsed, setUserCountFallbackUsed] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        const profiles = await loadAllUserProfiles();
        if (profiles && Object.keys(profiles).length > 0) {
          setUsers(profiles);
          setUserCountFallbackUsed(false);
        } else {
          // Fallback: per-uid reads for every UID we can derive from leagues.
          // Includes commissioner UIDs + per-team uid stamps (v2.6.6.0).
          // Existing teams from before v2.6.6.0 have no uid; admin sees fewer
          // users until those users re-join or save their roster (which
          // refreshes their team and stamps the uid).
          const uids = new Set();
          leagues.forEach(l => {
            if (l.commissionerUid) uids.add(l.commissionerUid);
            (l.teams || []).forEach(t => { if (t.uid) uids.add(t.uid); });
          });
          const fetched = {};
          await Promise.all([...uids].map(async uid => {
            try {
              const p = await loadUserProfile(uid);
              if (p) fetched[uid] = p;
            } catch {}
          }));
          setUsers(fetched);
          setUserCountFallbackUsed(true);
        }
        const ann = await loadData("site_announcement", "");
        setAnnouncement(ann || "");
        setSavedAnnouncement(ann || "");
      } catch {}
    })();
  }, [leagues]);

  async function saveAnnouncement() {
    const { saveData } = await import("./firebase.js");
    await saveData("site_announcement", announcement);
    setSavedAnnouncement(announcement);
  }

  async function clearAnnouncement() {
    const { saveData } = await import("./firebase.js");
    await saveData("site_announcement", "");
    setAnnouncement("");
    setSavedAnnouncement("");
  }

  const totalUsers = users ? Object.keys(users).length : "...";
  const totalLeagues = leagues.length;
  const totalTeams = leagues.reduce((sum, l) => sum + (l.teams||[]).length, 0);
  const totalContestants = leagues.reduce((sum, l) => sum + (l.contestants||[]).length, 0);
  const activeLeagues = leagues.filter(l => Object.keys(l.weeklyScores||{}).length > 0).length;

  // v2.6.3.0: Users + Leagues + Announce moved INTO the Manage tab (sub-views)
  // so the top level is just the high-leverage admin surfaces: Stats, Shows,
  // Manage, Audit Log.
  const tabs = [{id:"stats",label:"Stats"},{id:"shows",label:"Shows"},{id:"manage",label:"Manage"},{id:"audit",label:"Audit Log"}];
  const [manageSubTab, setManageSubTab] = useState("users");

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
        <button onClick={onBack} style={{ background:"none",border:"none",color:"#8888aa",cursor:"pointer",padding:4 }}><Icon name="back" size={20}/></button>
        <h2 style={{ margin:0,fontSize:20,fontFamily:"'Anybody',sans-serif",fontWeight:800,color:"#f5a623" }}>Admin Panel</h2>
      </div>

      <div style={{ display:"flex",gap:6,marginBottom:20,overflowX:"auto" }}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,
            background:tab===t.id?"#f5a62333":"#1e1e38",color:tab===t.id?"#f5a623":"#8888aa",
            fontFamily:"'Outfit',sans-serif",whiteSpace:"nowrap",transition:"all .15s"
          }}>{t.label}</button>
        ))}
      </div>

      {/* Stats Tab */}
      {tab==="stats" && (
        <div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12 }}>
            {[
              {label:"Total Users" + (userCountFallbackUsed ? " (approx)" : ""),value:totalUsers,color:"#4ecdc4"},
              {label:"Total Leagues",value:totalLeagues,color:"#e94560"},
              {label:"Active Leagues",value:activeLeagues,color:"#f5a623"},
              {label:"Total Teams",value:totalTeams,color:"#9d5dff"},
              {label:"Total Contestants",value:totalContestants,color:"#4d8aff"},
            ].map(s=>(
              <div key={s.label} style={{ padding:"20px 16px",background:"#12121f",borderRadius:12,border:"1px solid #1e1e38",textAlign:"center" }}>
                <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:32,fontWeight:900,color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11,color:"#6a6a8a",marginTop:4,fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {userCountFallbackUsed && (
            <div style={{ marginTop:14,padding:"10px 14px",background:"#f5a62311",border:"1px solid #f5a62333",borderRadius:8,fontSize:11,color:"#f5a623",lineHeight:1.5 }}>
              User count is approximate — derived from commissioner + per-team UID stamps on visible leagues. Existing managers from before v2.6.6.0 don't appear until they next save a roster. For an accurate total, run <code style={{color:"#e8e8f0"}}>firebase deploy --only database</code> from the project root (deploys the v2.6.3.0 rules update that allows admin to read the full <code style={{color:"#e8e8f0"}}>frtv_users</code> collection).
            </div>
          )}
        </div>
      )}

      {/* Shows Tab — v2.6.0.0 scaffolding. Houses (1) Scoring Rule Library
          management, (2) per-show base-rule editing, (3) Show-Wide episode
          scoring. The first two are read-only stubs in this commit (the
          architecture is in place but the RTDB writes + compute-on-read
          merge in scoring.js ship in a follow-up). The episode scoring UI
          is a clear "coming soon" placeholder so commissioners and the admin
          can see what's planned. */}
      {tab==="shows" && <AdminShowsTab />}

      {/* Audit Log Tab */}
      {tab==="audit" && (
        <div>
          <div style={{ fontSize:13,color:"#6a6a8a",marginBottom:16 }}>
            Recent activity across all leagues. Logged automatically when scoring, settings, or league data changes.
          </div>
          {(()=>{
            // Build audit entries from league data
            const entries = [];
            leagues.forEach(l => {
              // Score saves
              Object.keys(l.weeklyScores||{}).forEach(w => {
                entries.push({ time: l.createdAt + Number(w)*86400000, type: "scoring", desc: `${cadenceLabel(l, w)} scored`, league: l.name });
              });
              // League creation
              if (l.createdAt) entries.push({ time: l.createdAt, type: "create", desc: "League created", league: l.name });
              // Team additions
              (l.teams||[]).forEach(t => {
                entries.push({ time: l.createdAt + 1000, type: "team", desc: `Team "${t.name}" added`, league: l.name });
              });
            });
            entries.sort((a,b) => b.time - a.time);
            const recent = entries.slice(0, 30);
            return recent.length === 0 ? <EmptyState message="No activity yet." /> : (
              <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
                {recent.map((e,i) => (
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,background:"#12121f",border:"1px solid #1e1e38" }}>
                    <div style={{ width:8,height:8,borderRadius:"50%",flexShrink:0,
                      background:e.type==="scoring"?"#4ecdc4":e.type==="create"?"#f5a623":"#8888aa" }}/>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12,color:"#e8e8f0" }}>{e.desc}</div>
                      <div style={{ fontSize:10,color:"#6a6a8a" }}>{e.league} · {new Date(e.time).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Manage Tab — v2.6.3.0: now hosts sub-views for Users + Leagues +
          Tools (the former top-level tabs collapsed into Manage). */}
      {tab==="manage" && (
        <div>
          <div style={{ display:"flex",gap:4,marginBottom:16,padding:4,background:"#0d0d18",border:"1px solid #1e1e38",borderRadius:99,maxWidth:460,flexWrap:"wrap" }}>
            {[
              { id: "users", label: "Users" },
              { id: "leagues", label: "Leagues" },
              { id: "announce", label: "Announce" },
              { id: "tools", label: "Tools" },
            ].map(s => (
              <button key={s.id} onClick={()=>setManageSubTab(s.id)} style={{
                flex:1,padding:"6px 10px",borderRadius:99,border:"none",cursor:"pointer",
                background: manageSubTab===s.id ? "#f5a62333" : "transparent",
                color: manageSubTab===s.id ? "#f5a623" : "#7a7a9a",
                fontSize:12,fontWeight:manageSubTab===s.id?700:600,fontFamily:"'Outfit',sans-serif",
              }}>{s.label}</button>
            ))}
          </div>

          {manageSubTab === "users" && (
            <div>
              {!users ? <div style={{color:"#6a6a8a",fontSize:13}}>Loading users...</div> : (
                <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
                  {Object.entries(users).map(([uid, profile]) => (
                    <div key={uid} style={{ padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                      <div>
                        <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0" }}>{profile.displayName || "Unnamed"}</div>
                        <div style={{ fontSize:11,color:"#6a6a8a",marginTop:2 }}>
                          {Object.keys(profile.activations||{}).length} league{Object.keys(profile.activations||{}).length!==1?"s":""}
                          {profile.banned && <span style={{ color:"#e94560",marginLeft:8 }}>BANNED</span>}
                        </div>
                        <div style={{ fontSize:10,color:"#4a4a6a",marginTop:2,fontFamily:"monospace" }}>{uid.slice(0,12)}...</div>
                      </div>
                      <Btn small variant={profile.banned?"secondary":"danger"} onClick={async ()=>{
                        const action = profile.banned ? "unban" : "ban";
                        if(!confirm(action.charAt(0).toUpperCase()+action.slice(1)+" "+( profile.displayName||"this user")+"?")) return;
                        const { saveUserProfile } = await import("./firebase.js");
                        const updated = {...profile, banned: !profile.banned};
                        await saveUserProfile(uid, updated);
                        setUsers(prev => ({...prev, [uid]: updated}));
                      }}>{profile.banned ? "Unban" : "Ban"}</Btn>
                    </div>
                  ))}
                  {Object.keys(users).length === 0 && <div style={{color:"#6a6a8a",fontSize:13}}>No users yet.</div>}
                </div>
              )}
            </div>
          )}

          {manageSubTab === "leagues" && (
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {leagues.map(league => (
                <div key={league.id} style={{ padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                    <div>
                      <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0" }}>{league.name}</div>
                      <div style={{ fontSize:11,color:"#6a6a8a",marginTop:2 }}>
                        {league.seasonName} · {league.format} · {(league.teams||[]).length} teams · {(league.contestants||[]).length} contestants · {cadenceShort(league)} {league.currentWeek||1}
                      </div>
                      <div style={{ fontSize:10,color:"#4a4a6a",marginTop:2 }}>
                        {Object.keys(league.weeklyScores||{}).length} {cadenceWord(league).toLowerCase()}s scored
                        {league.useShowWideScoring && <span style={{ color:"#9d5dff",marginLeft:8 }}>Show-wide opt-in</span>}
                        {league.commissionerUid && <span style={{ color:"#f5a623",marginLeft:8 }}>Has commissioner</span>}
                      </div>
                    </div>
                    <div style={{ display:"flex",gap:6 }}>
                      <Btn small variant="ghost" onClick={()=>{
                        const data = JSON.stringify(league, null, 2);
                        const blob = new Blob([data], {type:"application/json"});
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = (league.name||"league").replace(/[^a-z0-9]/gi,"_") + "_backup.json";
                        a.click();
                        URL.revokeObjectURL(url);
                      }}>Export</Btn>
                    </div>
                  </div>
                </div>
              ))}
              {leagues.length === 0 && <div style={{color:"#6a6a8a",fontSize:13}}>No leagues yet.</div>}
            </div>
          )}

          {manageSubTab === "announce" && (
            <div>
              <div style={{ fontSize:12,color:"#6a6a8a",marginBottom:10,lineHeight:1.4 }}>
                Set a site-wide banner that all users see at the top of the home screen. Leave blank to hide.
              </div>
              <textarea value={announcement} onChange={e=>setAnnouncement(e.target.value)}
                placeholder="e.g. Survivor scoring for Week 4 is live! Check your standings."
                rows={3} style={{
                  width:"100%",padding:"10px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:8,
                  color:"#e8e8f0",fontSize:13,fontFamily:"'Outfit',sans-serif",resize:"vertical",marginBottom:10
                }} />
              <div style={{ display:"flex",gap:8 }}>
                <Btn small onClick={saveAnnouncement} disabled={announcement===savedAnnouncement}>
                  {announcement===savedAnnouncement ? "Saved" : "Save Announcement"}
                </Btn>
                {savedAnnouncement && <Btn small variant="danger" onClick={clearAnnouncement}>Clear</Btn>}
              </div>
              {savedAnnouncement && (
                <div style={{ marginTop:12,padding:"10px 14px",background:"#f5a62311",borderRadius:8,border:"1px solid #f5a62333" }}>
                  <div style={{ fontSize:11,fontWeight:600,color:"#f5a623" }}>Currently showing:</div>
                  <div style={{ fontSize:12,color:"#e8e8f0",marginTop:4 }}>{savedAnnouncement}</div>
                </div>
              )}
            </div>
          )}

          {manageSubTab === "tools" && (
        <div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:8 }}>Admin Emails</div>
            <div style={{ fontSize:12,color:"#6a6a8a",marginBottom:10,lineHeight:1.4 }}>
              These emails have full admin access to the platform. The primary admin cannot be removed.
            </div>
            <div style={{ padding:"10px 14px",background:"#12121f",borderRadius:8,border:"1px solid #1e1e38",marginBottom:8 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:13,color:"#e8e8f0" }}>admin@fantasyrealitytv.com</span>
                <span style={{ fontSize:10,color:"#f5a623",fontWeight:700 }}>PRIMARY</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:8 }}>Quick Actions</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              <Btn small variant="ghost" onClick={()=>{
                const data = JSON.stringify(leagues, null, 2);
                const blob = new Blob([data], {type:"application/json"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "all_leagues_backup_" + new Date().toISOString().slice(0,10) + ".json";
                a.click(); URL.revokeObjectURL(url);
              }}>Export All Leagues (Full Backup)</Btn>
              <Btn small variant="ghost" onClick={async ()=>{
                const input = document.createElement("input");
                input.type = "file"; input.accept = ".json";
                input.onchange = async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    const imported = JSON.parse(text);
                    if (Array.isArray(imported) && imported.length > 0 && imported[0].id) {
                      if (confirm("Import " + imported.length + " leagues? This will ADD them to your existing leagues (not replace).")) {
                        const merged = [...leagues];
                        for (const l of imported) {
                          if (!merged.find(m => m.id === l.id)) merged.push(l);
                          else { const idx = merged.findIndex(m => m.id === l.id); merged[idx] = l; }
                        }
                        await onUpdate(merged);
                        alert("Imported " + imported.length + " leagues.");
                      }
                    } else if (imported.id) {
                      if (confirm("Import league: " + imported.name + "?")) {
                        const merged = [...leagues];
                        const idx = merged.findIndex(m => m.id === imported.id);
                        if (idx >= 0) merged[idx] = imported; else merged.push(imported);
                        await onUpdate(merged);
                        alert("Imported: " + imported.name);
                      }
                    } else { alert("Invalid backup file."); }
                  } catch (err) { alert("Failed to parse file: " + err.message); }
                };
                input.click();
              }}>Import League from Backup</Btn>
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:8 }}>Feature Flags</div>
            <div style={{ fontSize:12,color:"#6a6a8a",marginBottom:10,lineHeight:1.4 }}>
              Toggle experimental features on/off across the platform.
            </div>
            {[
              { id: "new_formats", label: "New Formats (Survivor Pool, Elimination Pool, Predictions, Salary Cap)" },
              { id: "h2h", label: "Head-to-Head Matchups Setting" },
              { id: "best_ball", label: "Best Ball Setting" },
              { id: "roto", label: "Categories/Roto Scoring" },
            ].map(flag => (
              <label key={flag.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#12121f",borderRadius:8,border:"1px solid #1e1e38",marginBottom:6,cursor:"pointer" }}>
                <input type="checkbox" checked={featureFlags[flag.id]!==false} onChange={async e=>{
                  const newFlags = {...featureFlags, [flag.id]: e.target.checked};
                  setFeatureFlags(newFlags);
                  const { saveData } = await import("./firebase.js");
                  await saveData("feature_flags", newFlags);
                }} style={{ accentColor:"#4ecdc4",width:16,height:16 }} />
                <span style={{ fontSize:12,color:"#e8e8f0" }}>{flag.label}</span>
              </label>
            ))}
          </div>

          <div>
            <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:8 }}>Platform Info</div>
            <div style={{ display:"flex",flexDirection:"column",gap:4,fontSize:12,color:"#6a6a8a" }}>
              <div>Stack: Vite + React + Firebase</div>
              <div>Hosting: Netlify (auto-deploy from GitHub)</div>
              <div>Database: Firebase Realtime Database</div>
              <div>Auth: Firebase Authentication (Email + Google)</div>
            </div>
          </div>
        </div>
          )}
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTH SCREEN (Login / Sign Up / Join via Code)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AuthScreen({ onJoinViaCode, pendingJoinCode }) {
  // If the user arrived via an invite link (?join=CODE), default to Sign Up —
  // most invitees won't have an account yet, and skipping the extra tab tap
  // smooths the onboarding flow.
  const [mode, setMode] = useState(pendingJoinCode ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) { setError("Enter email and password."); return; }
    setBusy(true); setError("");
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e.code === "auth/invalid-credential" ? "Invalid email or password." :
               e.code === "auth/user-not-found" ? "No account found with this email." :
               e.code === "auth/wrong-password" ? "Incorrect password." :
               e.code === "auth/too-many-requests" ? "Too many attempts. Try again later." :
               e.message);
    }
    setBusy(false);
  }

  async function handleGoogleLogin() {
    setBusy(true); setError("");
    try {
      await signInWithGoogle();
    } catch (e) {
      if (e.code !== "auth/popup-closed-by-user") setError(e.message);
    }
    setBusy(false);
  }

  async function handleSignup() {
    if (!email.trim() || !password || !displayName.trim()) { setError("Fill in all fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setBusy(true); setError("");
    try {
      await signUp(email.trim(), password, displayName.trim());
      // Invite code (if present) was captured into URL state at app boot and
      // is auto-applied by AppHome's onMount effect once the user lands there.
      // No need to stash it in localStorage from the signup form anymore.
    } catch (e) {
      setError(e.code === "auth/email-already-in-use" ? "An account with this email already exists. Try logging in." :
               e.code === "auth/weak-password" ? "Password must be at least 6 characters." :
               e.code === "auth/invalid-email" ? "Invalid email address." :
               e.message);
    }
    setBusy(false);
  }

  async function handleForgot() {
    if (!email.trim()) { setError("Enter your email address."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      await resetPassword(email.trim());
      setMessage("Password reset email sent! Check your inbox.");
    } catch (e) {
      setError(e.code === "auth/user-not-found" ? "No account found with this email." : e.message);
    }
    setBusy(false);
  }

  const inputStyle = { width:"100%",padding:"12px 14px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:8,
    color:"#e8e8f0",fontSize:14,fontFamily:"'Outfit',sans-serif",marginBottom:12 };

  return (
    <div>
      <div style={{ textAlign:"center",padding:"50px 20px 30px" }}>
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:40,height:40}}>
              <rect x="3" y="5" width="26" height="18" rx="3" stroke="#ff4d6a" strokeWidth="2.5" fill="none"/>
              <line x1="11" y1="27" x2="21" y2="27" stroke="#7a7a9a" strokeWidth="2.5" strokeLinecap="round"/>
              <line x1="16" y1="23" x2="16" y2="27" stroke="#7a7a9a" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M13 10 L13 16 Q16 19 19 16 L19 10 Z" fill="#ffd23d" opacity="0.85"/>
              <path d="M11 10.5 Q11 13 13 13" stroke="#ff8a3d" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M21 10.5 Q21 13 19 13" stroke="#ff8a3d" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
        <h1 style={{ fontFamily:"'Anybody',sans-serif",fontSize:32,fontWeight:900,
          background:"linear-gradient(135deg,#e94560,#f5a623,#e94560)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:"0 0 6px" }}>
          Fantasy Reality
        </h1>
        <p style={{ color:"#6a6a8a",fontSize:14,margin:0 }}>Draft. Score. Dominate.</p>
      </div>
      <div style={{ padding:"0 20px 20px" }}>
        {/* Invite banner — shown when the user landed here via a ?join=CODE link */}
        {pendingJoinCode && (
          <div style={{ marginBottom:16,padding:"14px 16px",background:"linear-gradient(135deg,#e9456018,#f5a62318)",border:"1px solid #e9456044",borderRadius:10 }}>
            <div style={{ fontSize:11,fontWeight:700,color:"#f5a623",letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:4 }}>You're invited!</div>
            <div style={{ fontSize:13,color:"#e8e8f0",lineHeight:1.5 }}>
              You've been invited to join a Fantasy Reality TV league. {mode === "signup" ? "Create an account below" : "Log in below"} and you'll be added to the league automatically.
            </div>
            <div style={{ marginTop:6,fontSize:11,color:"#8888aa",fontFamily:"monospace",letterSpacing:"0.15em" }}>Invite code: <span style={{ color:"#4ecdc4",fontWeight:700 }}>{pendingJoinCode}</span></div>
          </div>
        )}

        {/* Mode tabs */}
        <div style={{ display:"flex",gap:6,marginBottom:20 }}>
          {[{id:"login",label:"Log In"},{id:"signup",label:"Sign Up"}].map(t=>(
            <button key={t.id} onClick={()=>{setMode(t.id);setError("");setMessage("")}} style={{
              flex:1,padding:"10px",borderRadius:8,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,
              background:mode===t.id?"#e9456033":"#1e1e38",color:mode===t.id?"#e94560":"#8888aa",
              fontFamily:"'Outfit',sans-serif",transition:"all 0.15s ease",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Login */}
        {mode === "login" && (
          <div>
            <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")handleLogin()}} style={inputStyle} />
            {error && <div style={{ color:"#e94560",fontSize:12,marginBottom:10 }}>{error}</div>}
            <button onClick={handleLogin} disabled={busy} style={{
              width:"100%",padding:"12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:14,fontWeight:700,
              background:"linear-gradient(135deg,#e94560,#c23152)",color:"#fff",fontFamily:"'Outfit',sans-serif",
              opacity:busy?0.6:1,marginBottom:10,
            }}>{busy ? "..." : "Log In"}</button>
            <button onClick={handleGoogleLogin} disabled={busy} style={{
              width:"100%",padding:"12px",borderRadius:8,border:"1px solid #2a2a4a",cursor:"pointer",fontSize:14,fontWeight:600,
              background:"#12121f",color:"#e8e8f0",fontFamily:"'Outfit',sans-serif",
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:12,
            }}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Sign in with Google
            </button>
            <button onClick={()=>{setMode("forgot");setError("");setMessage("")}} style={{
              background:"none",border:"none",color:"#6a6a8a",cursor:"pointer",fontSize:12,
              fontFamily:"'Outfit',sans-serif",width:"100%",textAlign:"center",padding:4,
            }}>Forgot password?</button>
          </div>
        )}

        {/* Sign Up */}
        {mode === "signup" && (
          <div>
            <input type="text" placeholder="Display name" value={displayName} onChange={e=>setDisplayName(e.target.value)} style={inputStyle} />
            <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Password (6+ characters)" value={password} onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")handleSignup()}} style={inputStyle} />
            {error && <div style={{ color:"#e94560",fontSize:12,marginBottom:10 }}>{error}</div>}
            <button onClick={handleSignup} disabled={busy} style={{
              width:"100%",padding:"12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:14,fontWeight:700,
              background:"linear-gradient(135deg,#e94560,#c23152)",color:"#fff",fontFamily:"'Outfit',sans-serif",
              opacity:busy?0.6:1,marginBottom:10,
            }}>{busy ? "..." : "Create Account"}</button>
            <button onClick={handleGoogleLogin} disabled={busy} style={{
              width:"100%",padding:"12px",borderRadius:8,border:"1px solid #2a2a4a",cursor:"pointer",fontSize:14,fontWeight:600,
              background:"#12121f",color:"#e8e8f0",fontFamily:"'Outfit',sans-serif",
              display:"flex",alignItems:"center",justifyContent:"center",gap:8,
            }}>
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Sign up with Google
            </button>
          </div>
        )}

        {/* Forgot Password */}
        {mode === "forgot" && (
          <div>
            <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")handleForgot()}} style={inputStyle} />
            {error && <div style={{ color:"#e94560",fontSize:12,marginBottom:10 }}>{error}</div>}
            {message && <div style={{ color:"#4ecdc4",fontSize:12,marginBottom:10 }}>{message}</div>}
            <button onClick={handleForgot} disabled={busy} style={{
              width:"100%",padding:"12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:14,fontWeight:700,
              background:"linear-gradient(135deg,#e94560,#c23152)",color:"#fff",fontFamily:"'Outfit',sans-serif",
              opacity:busy?0.6:1,marginBottom:10,
            }}>{busy ? "..." : "Send Reset Email"}</button>
            <button onClick={()=>{setMode("login");setError("");setMessage("")}} style={{
              background:"none",border:"none",color:"#6a6a8a",cursor:"pointer",fontSize:12,
              fontFamily:"'Outfit',sans-serif",width:"100%",textAlign:"center",padding:4,
            }}>Back to login</button>
          </div>
        )}

      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// APP HOME
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AppHome({ user, profile, leagues, isAdmin, onSelectLeague, onCreateLeague, onDeleteLeague, onDuplicateLeague, onLogout, onJoinViaCode, onOpenAdmin, onOpenSettings, allLeaguesCount, announcement, pendingJoinCode }) {
  const [inviteCode, setInviteCode] = useState(pendingJoinCode || "");
  const [error, setError] = useState("");
  const [joining, setJoining] = useState(false);
  // v2.4.52.0: Join-via-code box collapses behind an explicit "Join" button
  // next to "Create". Was always-visible above My Leagues, which felt like
  // clutter for the common case (user just wants to open a league they're
  // already in). URL-based invite links still auto-apply via the useEffect
  // below — the button is only for the bare-code-via-text/Discord path.
  const [showJoin, setShowJoin] = useState(false);



  // Handle pending invite codes on mount.
  // AppHome only renders after auth is complete, so onJoinViaCode has correct userProfile here.
  // v2.5.0.0: URL-based and post-signup joins pass autoConfirm so users land
  // directly on the joined league instead of pausing on AppHome with a confirm
  // modal. Manual code entry (the Join League button below) still goes through
  // the modal as a sanity-check.
  useEffect(() => {
    // URL-based join (?join=CODE — passed as pendingJoinCode prop)
    if (pendingJoinCode && pendingJoinCode.length >= 6) {
      (async () => {
        const err = await onJoinViaCode(pendingJoinCode, { autoConfirm: true });
        if (err) setError(err);
      })();
    }
    // Post-signup join (code stored in localStorage by AuthScreen signup flow)
    const pending = localStorage.getItem("frtv_pending_invite");
    if (pending) {
      localStorage.removeItem("frtv_pending_invite");
      (async () => {
        const err = await onJoinViaCode(pending, { autoConfirm: true });
        if (err) setError(err);
      })();
    }
  }, []);

  async function handleJoin() {
    if (inviteCode.length < 6) return;
    setError("");
    setJoining(true);
    try {
      const err = await onJoinViaCode(inviteCode);
      if (err) setError(err);
      else setInviteCode("");
    } catch (e) {
      console.error("Join error:", e);
      setError("Error: " + (e.message || "Something went wrong. Please try again."));
    }
    setJoining(false);
  }

  const displayName = profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "User";

  return (
    <div>
      <div style={{ padding:"20px 20px 10px",display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap" }}>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:12,color:"#6a6a8a" }}>Welcome back,</div>
          <div style={{ fontSize:18,fontWeight:800,fontFamily:"'Anybody',sans-serif",color:"#e8e8f0" }}>
            {displayName} {isAdmin && <span style={{ fontSize:12,color:"#f5a623" }}>★ Admin</span>}
          </div>
        </div>
        <div style={{ display:"flex",gap:6,alignItems:"center",flexShrink:0,flexWrap:"wrap" }}>
          {isAdmin && <button onClick={onOpenAdmin} style={{ background:"none",border:"1px solid #2a2a4a",borderRadius:6,padding:"6px 12px",
            color:"#f5a623",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600,flexShrink:0 }}>Admin</button>}
          <button onClick={()=>{
            const subject = encodeURIComponent("FRTV Feedback");
            const body = encodeURIComponent("\n\n---\nUser: " + (user?.email||"unknown"));
            window.open("mailto:admin@fantasyrealitytv.com?subject=" + subject + "&body=" + body);
          }} title="Send feedback or report a bug" style={{ background:"none",border:"1px solid #2a2a4a",borderRadius:6,padding:"6px 12px",
            color:"#6a6a8a",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif",flexShrink:0 }}>Support</button>
          <button onClick={onOpenSettings} style={{ background:"none",border:"1px solid #2a2a4a",borderRadius:6,padding:"6px 12px",
            color:"#6a6a8a",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif",flexShrink:0 }}>Account</button>
        </div>
      </div>

      {announcement && (
        <div style={{ margin:"0 20px 0",padding:"10px 14px",background:"#f5a62315",borderRadius:10,border:"1px solid #f5a62333" }}>
          <div style={{ fontSize:13,color:"#f5a623",lineHeight:1.5 }}>{announcement}</div>
        </div>
      )}
      <div style={{ padding:"10px 20px 20px" }}>
        {/* League list */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,gap:6,flexWrap:"wrap" }}>
          <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>My Leagues</h3>
          <div style={{ display:"flex",gap:6 }}>
            <Btn small variant="ghost" onClick={()=>{ setShowJoin(s => !s); setError(""); }}>
              <Icon name="plus" size={12}/> Join League
            </Btn>
            {(isAdmin || (allLeaguesCount || 0) < 3) && (
              <Btn small onClick={onCreateLeague}><Icon name="plus" size={12}/> Create League</Btn>
            )}
          </div>
        </div>

        {/* Invite-code entry — collapsed by default, revealed by Join League button.
            URL-based invite LINKS bypass this entirely (auto-applied at app boot). */}
        {showJoin && (
          <div style={{ marginBottom:20,padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6 }}>
              <div style={{ fontSize:12,fontWeight:600,color:"#8888aa" }}>Have an invite code?</div>
              <button onClick={()=>{ setShowJoin(false); setError(""); setInviteCode(""); }} title="Cancel" style={{ background:"none",border:"1px solid #2a2a4a",borderRadius:6,color:"#8888aa",fontSize:10,cursor:"pointer",padding:"3px 8px",fontFamily:"'Outfit',sans-serif" }}>× Cancel</button>
            </div>
            <div style={{ fontSize:11,color:"#6a6a8a",marginBottom:8,lineHeight:1.4 }}>If someone shared an invite link, just tap it &mdash; no code entry needed.</div>
            <div style={{ display:"flex",gap:6 }}>
              <input value={inviteCode} onChange={e=>setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))}
                placeholder="Enter code" maxLength={8} autoFocus onKeyDown={e=>{if(e.key==="Enter")handleJoin()}}
                style={{ flex:1,padding:"8px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
                  color:"#e8e8f0",fontSize:16,fontFamily:"monospace",letterSpacing:"0.15em",textAlign:"center" }} />
              <Btn small onClick={handleJoin} disabled={inviteCode.length<6 || joining}>
                {joining ? "Checking..." : "Join"}
              </Btn>
            </div>
            {error && <div style={{ color:"#e94560",fontSize:12,marginTop:8,padding:"8px 10px",background:"#e9456011",borderRadius:6,border:"1px solid #e9456033" }}>{error}</div>}
          </div>
        )}

        {leagues.length > 0 ? (
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {leagues.map(league => {
              const myTeamId = profile?.activations?.[league.id];
              const myTeam = myTeamId ? (league.teams||[]).find(t=>t.id===myTeamId) : null;
              return (
                <div key={league.id} style={{ display:"flex",alignItems:"center",gap:14,background:"#12121f",border:"1px solid #2a2a4a",borderRadius:12,overflow:"hidden" }}>
                  <button onClick={() => onSelectLeague(league.id)} style={{
                    flex:1,display:"flex",alignItems:"center",gap:14,padding:"16px 18px",
                    cursor:"pointer",textAlign:"left",background:"transparent",border:"none",transition:"all 0.15s ease",
                  }}>
                    <div style={{ width:40,height:40,borderRadius:10,background:(SHOW_PRESETS[league.showType]?.color||"#9d5dff")+"18",
                      border:"1px solid "+(SHOW_PRESETS[league.showType]?.color||"#9d5dff")+"33",
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontFamily:"'Anybody',sans-serif",fontSize:14,fontWeight:900,
                      color:SHOW_PRESETS[league.showType]?.color||"#9d5dff",flexShrink:0
                    }}>{SHOW_PRESETS[league.showType]?.emoji||"TV"}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ color:"#e8e8f0",fontWeight:700,fontSize:15,fontFamily:"'Anybody',sans-serif" }}>{league.name}</div>
                      <div style={{ color:"#6a6a8a",fontSize:12,marginTop:2 }}>{league.seasonName} · {cadenceShort(league)} {league.currentWeek||1} · {(league.teams||[]).length} team{(league.teams||[]).length!==1?"s":""}{league.commissionerUid === user?.uid && !isAdmin ? " · Commissioner" : ""}</div>
                      {myTeam && (()=>{
                        const standings = calcStandings(league);
                        const myRank = standings.findIndex(t=>t.id===myTeam.id) + 1;
                        const myPts = standings.find(t=>t.id===myTeam.id)?.total || 0;
                        return myRank > 0 ? (
                          <div style={{ fontSize:11,color:myRank<=3?"#f5a623":"#6a6a8a",marginTop:2 }}>
                            {myRank===1?"🥇":myRank===2?"🥈":myRank===3?"🥉":"#"+myRank} · {myPts>0?"+":""}{formatPts(myPts, league)} pts
                          </div>
                        ) : null;
                      })()}
                      {myTeam && <div style={{ color:"#8888aa",fontSize:11,marginTop:2 }}>{myTeam.name}</div>}
                    </div>
                    <Icon name="chevron" size={16}/>
                  </button>
                  {(isAdmin || league.commissionerUid === user?.uid) && (
                    <div style={{ display:"flex",flexDirection:"column",gap:6,padding:"0 10px 0 0" }}>
                      <button onClick={()=>onDuplicateLeague(league.id)} title="Duplicate for new season" style={{
                        background:"none",border:"none",color:"#4ecdc4",cursor:"pointer",padding:2,fontSize:11,fontFamily:"'Outfit',sans-serif",
                      }}>Copy</button>
                      <button onClick={()=>onDeleteLeague(league.id)} style={{
                        background:"none",border:"none",color:"#4a4a6a",cursor:"pointer",padding:2,
                      }}><Icon name="trash" size={14}/></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState message={isAdmin ? "No leagues yet. Create one!" : "No leagues yet. Enter an invite code above to join, or create your own!"} />
        )}
      </div>
    </div>
  );
}

