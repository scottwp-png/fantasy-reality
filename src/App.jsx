import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { loadData, saveData, deleteData, loadAllLeagues, saveAllLeagues, clearAllStorage, loadUserProfile, saveUserProfile, loadAllUserProfiles, onAuthChange, signUp, signIn, signInWithGoogle, signOut, resetPassword, ADMIN_EMAIL } from "./firebase.js"
import * as XLSX from "xlsx"


const IMPORTED_LEAGUES = [{"id": "survivor_50", "name": "Fantasy Survivor", "showType": "survivor", "showName": "Survivor", "seasonName": "Season 50", "format": "captains", "captainsConfig": {"regularSlots": 3}, "standardConfig": null, "scoringRules": [{"id": "loses_vote_due_to_risk", "label": "Loses Vote Due to Risk", "points": -2.0, "category": "Strategy/Social"}, {"id": "volunteers_for_journey___risk", "label": "Volunteers for Journey / Risk", "points": 1.0, "category": "Strategy/Social"}, {"id": "gains_advantage___idol", "label": "Gains Advantage / Idol", "points": 2.0, "category": "Strategy/Social"}, {"id": "finds_hidden_immunity_idol", "label": "Finds Hidden Immunity Idol", "points": 3.0, "category": "Strategy/Social"}, {"id": "successfully_splits_vote", "label": "Successfully Splits Vote", "points": 3.0, "category": "Strategy/Social"}, {"id": "uses_extra_vote_successfully", "label": "Uses Extra Vote Successfully", "points": 3.0, "category": "Strategy/Social"}, {"id": "steals_vote_successfully", "label": "Steals Vote Successfully", "points": 4.0, "category": "Strategy/Social"}, {"id": "successfully_executes_blindside", "label": "Successfully Executes Blindside", "points": 5.0, "category": "Strategy/Social"}, {"id": "1st_to_make_fire_for_their_tribe", "label": "1st To Make Fire for Their Tribe", "points": 5.0, "category": "Strategy/Social"}, {"id": "wins_shot_in_the_dark", "label": "Wins Shot in the Dark", "points": 20.0, "category": "Strategy/Social"}, {"id": "blamed_for_team_loss", "label": "Blamed for team loss", "points": -2.0, "category": "Challenge Performance"}, {"id": "last_place_team_immunity", "label": "Last Place Team Immunity", "points": -1.0, "category": "Challenge Performance"}, {"id": "last_place_team_reward", "label": "Last Place Team Reward", "points": -0.5, "category": "Challenge Performance"}, {"id": "first_place_team_reward", "label": "First Place Team Reward", "points": 0.5, "category": "Challenge Performance"}, {"id": "first_place_team_immunity", "label": "First Place Team Immunity", "points": 1.0, "category": "Challenge Performance"}, {"id": "picked_to_go_with_winner_of_individual_reward", "label": "Picked to go with winner of Individual Reward", "points": 0.5, "category": "Challenge Performance"}, {"id": "wins_individual_reward", "label": "Wins Individual Reward", "points": 2.0, "category": "Challenge Performance"}, {"id": "wins_individual_immunity", "label": "Wins Individual Immunity", "points": 4.0, "category": "Challenge Performance"}, {"id": "eliminated_with_idol_advantage", "label": "Eliminated with Idol/Advantage", "points": -15.0, "category": "Tribal"}, {"id": "eliminated", "label": "Eliminated", "points": -10.0, "category": "Tribal"}, {"id": "plays_hidden_immunity_idol_incorrectly", "label": "Plays Hidden Immunity Idol Incorrectly", "points": -3.0, "category": "Tribal"}, {"id": "receives_a_vote", "label": "Receives a Vote", "points": -1.0, "category": "Tribal"}, {"id": "receives_zero_votes_at_tribal", "label": "Receives Zero Votes at Tribal", "points": 2.0, "category": "Tribal"}, {"id": "correct_vote", "label": "Correct Vote", "points": 3.0, "category": "Tribal"}, {"id": "saved_by_advantage", "label": "Saved by Advantage", "points": 3.0, "category": "Tribal"}, {"id": "plays_hidden_immunity_idol_successfully", "label": "Plays Hidden Immunity Idol Successfully", "points": 6.0, "category": "Tribal"}, {"id": "1st_member_of_the_jury", "label": "1st Member of the Jury", "points": 5.0, "category": "Endgame"}, {"id": "wins_final_4_fire_making_challenge", "label": "Wins Final 4 Fire Making Challenge", "points": 5.0, "category": "Endgame"}, {"id": "final_5", "label": "Final 5", "points": 10.0, "category": "Endgame"}, {"id": "final_4", "label": "Final 4", "points": 15.0, "category": "Endgame"}, {"id": "winner_of_the_show", "label": "Winner of the Show", "points": 50.0, "category": "Endgame"}], "contestants": [{"id": "coach", "name": "\"Coach\"", "bio": "Benjamin \"Coach\" Wade \u00b7 4x player (S18 Tocantins, S20 Heroes vs. Villains, S23 South Pacific, S50) \u00b7 Runner-up S23 \u00b7 Kalo Tribe", "gender": "", "status": "active", "tribe": "Kalo"}, {"id": "angelina_k", "name": "Angelina K.", "bio": "Angelina Keeley \u00b7 S37 David vs. Goliath \u00b7 Known for negotiating and bold gameplay \u00b7 Vatu Tribe", "gender": "", "status": "active", "tribe": "Vatu"}, {"id": "aubry_b", "name": "Aubry B.", "bio": "Aubry Bracco \u00b7 3x player (S32 Ka\u00f4h R\u014dng, S34 Game Changers, S38 Edge of Extinction) \u00b7 Runner-up S32 \u00b7 Vatu Tribe", "gender": "", "status": "active", "tribe": "Vatu"}, {"id": "charlie_d", "name": "Charlie D.", "bio": "Charlie Davis \u00b7 S46 runner-up \u00b7 Betrayed by ally Maria at Final Tribal \u00b7 Kalo Tribe", "gender": "", "status": "active", "tribe": "Kalo"}, {"id": "chrissy_h", "name": "Chrissy H.", "bio": "Chrissy Hofbeck \u00b7 S35 Heroes vs. Healers vs. Hustlers runner-up \u00b7 Won 4 immunity challenges \u00b7 Kalo Tribe", "gender": "", "status": "active", "tribe": "Kalo"}, {"id": "christian_h", "name": "Christian H.", "bio": "Christian Hubicki \u00b7 S37 David vs. Goliath \u00b7 Fan-favorite challenge beast and strategist \u00b7 Cila Tribe", "gender": "", "status": "active", "tribe": "Cila"}, {"id": "cirie_f", "name": "Cirie F.", "bio": "Cirie Fields \u00b7 5x player (S12, S16, S20, S34, S50) \u00b7 Legendary strategist, never voted out at Tribal \u00b7 Cila Tribe", "gender": "", "status": "active", "tribe": "Cila"}, {"id": "colby_d", "name": "Colby D.", "bio": "Colby Donaldson \u00b7 3x player (S2 Australian Outback, S8 All-Stars, S20 Heroes vs. Villains) \u00b7 Runner-up S2 \u00b7 Vatu Tribe", "gender": "", "status": "active", "tribe": "Vatu"}, {"id": "dee_v", "name": "Dee V.", "bio": "Dee Valladares \u00b7 S45 Sole Survivor / Winner \u00b7 Returning to prove her win wasn't a fluke \u00b7 Kalo Tribe", "gender": "", "status": "active", "tribe": "Kalo"}, {"id": "emily_f", "name": "Emily F.", "bio": "Emily Flippen \u00b7 S45 \u00b7 Known for her dramatic early-game turnaround \u00b7 Cila Tribe", "gender": "", "status": "active", "tribe": "Cila"}, {"id": "genevieve_m", "name": "Genevieve M.", "bio": "Genevieve Mushaluk \u00b7 S46 \u00b7 Strategic powerhouse and jury threat \u00b7 Vatu Tribe", "gender": "", "status": "active", "tribe": "Vatu"}, {"id": "jenna_l", "name": "Jenna L.", "bio": "Jenna Lewis-Dougherty \u00b7 2x player (S1 Borneo, S8 All-Stars) \u00b7 Original cast member, 3rd place All-Stars \u00b7 Cila Tribe \u00b7 ELIMINATED Ep. 1", "gender": "", "status": "eliminated", "tribe": "Cila", "eliminatedWeek": 1}, {"id": "joe_h", "name": "Joe H.", "bio": "Joe Hunter \u00b7 S48 \u00b7 3rd place finisher, part of one of the show's most touching moments \u00b7 Cila Tribe", "gender": "", "status": "active", "tribe": "Cila"}, {"id": "jonathan_y", "name": "Jonathan Y.", "bio": "Jonathan Young \u00b7 S42 \u00b7 4th place, known for incredible physical strength \u00b7 Kalo Tribe", "gender": "", "status": "active", "tribe": "Kalo"}, {"id": "kamilla_k", "name": "Kamilla K.", "bio": "Kamilla Karthigesu \u00b7 S48 \u00b7 4th place finisher, had secret alliance with winner Kyle Fraser \u00b7 Kalo Tribe", "gender": "", "status": "active", "tribe": "Kalo"}, {"id": "kyle_f", "name": "Kyle F.", "bio": "Kyle Fraser \u00b7 S48 Sole Survivor / Winner \u00b7 Playing back-to-back seasons \u00b7 Kalo Tribe \u00b7 MEDICALLY EVACUATED Ep. 1", "gender": "", "status": "eliminated", "tribe": "Kalo", "eliminatedWeek": 1}, {"id": "mike_w", "name": "Mike W.", "bio": "Mike White \u00b7 S37 David vs. Goliath \u00b7 Creator of The White Lotus, Hollywood writer/producer \u00b7 Kalo Tribe", "gender": "", "status": "active", "tribe": "Kalo"}, {"id": "ozzy_l", "name": "Ozzy L.", "bio": "Ozzy Lusth \u00b7 5x player (S13, S16, S23, S34, S50) \u00b7 Legendary challenge beast, runner-up S13 \u00b7 Cila Tribe", "gender": "", "status": "active", "tribe": "Cila"}, {"id": "q_burdette", "name": "Q Burdette", "bio": "Quintavius \"Q\" Burdette \u00b7 S46 \u00b7 Bold and unpredictable player \u00b7 Vatu Tribe \u00b7 ELIMINATED Ep. 3", "gender": "", "status": "active", "tribe": "Vatu"}, {"id": "rick_d", "name": "Rick D.", "bio": "Rick Devens \u00b7 S38 Edge of Extinction \u00b7 Host of Survivor's official On Fire podcast \u00b7 Cila Tribe", "gender": "", "status": "active", "tribe": "Cila"}, {"id": "rizo_v", "name": "Rizo V.", "bio": "Rizo Velovic \u00b7 S49 \u00b7 Playing back-to-back, came from most recent season \u00b7 Vatu Tribe", "gender": "", "status": "active", "tribe": "Vatu"}, {"id": "savannah_l", "name": "Savannah L.", "bio": "Savannah Louie \u00b7 S49 Sole Survivor / Winner \u00b7 Playing back-to-back after winning S49 \u00b7 Cila Tribe \u00b7 ELIMINATED Ep. 2", "gender": "", "status": "eliminated", "tribe": "Cila", "eliminatedWeek": 2}, {"id": "stephenie_k", "name": "Stephenie K.", "bio": "Stephenie LaGrossa Kendrick \u00b7 3x player (S10 Palau, S11 Guatemala, S20 Heroes vs. Villains) \u00b7 Runner-up S11 \u00b7 Vatu Tribe", "gender": "", "status": "active", "tribe": "Vatu"}, {"id": "tiffany_e", "name": "Tiffany E.", "bio": "Tiffany Nicole Ervin \u00b7 S46 \u00b7 8th place, fan-favorite with infectious energy \u00b7 Kalo Tribe", "gender": "", "status": "active", "tribe": "Kalo"}], "teams": [{"id": "brian", "name": "Team Brian", "owner": "Brian", "depthChart": {"captain": "joe_h", "coCaptain": "christian_h", "regulars": ["aubry_b", "cirie_f", "jonathan_y"]}, "weeklyRosters": {}, "weeklyDepthCharts": {"1": {"captain": "joe_h", "coCaptain": "aubry_b", "regulars": ["tiffany_e", "cirie_f", "jonathan_y"]}, "2": {"captain": "joe_h", "coCaptain": "christian_h", "regulars": ["aubry_b", "cirie_f", "jonathan_y"]}}}, {"id": "kyle", "name": "Team Kyle", "owner": "Kyle", "depthChart": {"captain": "joe_h", "coCaptain": "savannah_l", "regulars": ["charlie_d", "dee_v", "emily_f"]}, "weeklyRosters": {}, "weeklyDepthCharts": {"1": {"captain": "joe_h", "coCaptain": "dee_v", "regulars": ["charlie_d", "savannah_l", "kyle_f"]}, "2": {"captain": "joe_h", "coCaptain": "savannah_l", "regulars": ["charlie_d", "dee_v", "emily_f"]}}}, {"id": "lana", "name": "Team Lana", "owner": "Lana", "depthChart": {"captain": "stephenie_k", "coCaptain": "coach", "regulars": ["savannah_l", "q_burdette", "chrissy_h"]}, "weeklyRosters": {}, "weeklyDepthCharts": {"1": {"captain": "q_burdette", "coCaptain": "coach", "regulars": ["cirie_f", "stephenie_k", "chrissy_h"]}, "2": {"captain": "stephenie_k", "coCaptain": "coach", "regulars": ["savannah_l", "q_burdette", "chrissy_h"]}}}, {"id": "matt", "name": "Team Matt", "owner": "Matt", "depthChart": {"captain": "coach", "coCaptain": "dee_v", "regulars": ["cirie_f", "christian_h", "rizo_v"]}, "weeklyRosters": {}, "weeklyDepthCharts": {"1": {"captain": "coach", "coCaptain": "dee_v", "regulars": ["cirie_f", "christian_h", "rizo_v"]}, "2": {"captain": "coach", "coCaptain": "dee_v", "regulars": ["cirie_f", "christian_h", "rizo_v"]}}}, {"id": "nikki", "name": "Team Nikki", "owner": "Nikki", "depthChart": {"captain": "dee_v", "coCaptain": "joe_h", "regulars": ["mike_w", "christian_h", "cirie_f"]}, "weeklyRosters": {}, "weeklyDepthCharts": {"1": {"captain": "dee_v", "coCaptain": "joe_h", "regulars": ["mike_w", "stephenie_k", "cirie_f"]}, "2": {"captain": "dee_v", "coCaptain": "joe_h", "regulars": ["mike_w", "christian_h", "cirie_f"]}}}, {"id": "sam", "name": "Team Sam", "owner": "Sam", "depthChart": {"captain": "coach", "coCaptain": "joe_h", "regulars": ["cirie_f", "stephenie_k", "mike_w"]}, "weeklyRosters": {}, "weeklyDepthCharts": {"1": {"captain": "coach", "coCaptain": "joe_h", "regulars": ["cirie_f", "chrissy_h", "mike_w"]}, "2": {"captain": "coach", "coCaptain": "joe_h", "regulars": ["cirie_f", "stephenie_k", "mike_w"]}}}, {"id": "skot", "name": "Team Skot", "owner": "Skot", "depthChart": {"captain": "rick_d", "coCaptain": "kamilla_k", "regulars": ["ozzy_l", "aubry_b", "emily_f"]}, "weeklyRosters": {}, "weeklyDepthCharts": {"1": {"captain": "kyle_f", "coCaptain": "ozzy_l", "regulars": ["aubry_b", "emily_f", "rick_d"]}, "2": {"captain": "rick_d", "coCaptain": "kamilla_k", "regulars": ["ozzy_l", "aubry_b", "emily_f"]}}}, {"id": "steve", "name": "Team Steve", "owner": "Steve", "depthChart": {"captain": "aubry_b", "coCaptain": "savannah_l", "regulars": ["coach", "dee_v", "christian_h"]}, "weeklyRosters": {}, "weeklyDepthCharts": {"1": {"captain": "aubry_b", "coCaptain": "cirie_f", "regulars": ["savannah_l", "dee_v", "christian_h"]}, "2": {"captain": "aubry_b", "coCaptain": "savannah_l", "regulars": ["coach", "dee_v", "christian_h"]}}}, {"id": "zach", "name": "Team Zach", "owner": "Zach", "depthChart": {"captain": "dee_v", "coCaptain": "christian_h", "regulars": ["emily_f", "savannah_l", "rick_d"]}, "weeklyRosters": {}, "weeklyDepthCharts": {"1": {"captain": "dee_v", "coCaptain": "christian_h", "regulars": ["emily_f", "charlie_d", "rick_d"]}, "2": {"captain": "dee_v", "coCaptain": "christian_h", "regulars": ["emily_f", "savannah_l", "rick_d"]}}}], "weeklyScores": {"1": {"coach": {"gains_advantage___idol": 2.0, "first_place_team_reward": 1.0, "first_place_team_immunity": 1.0, "wins_individual_reward": 2.0}, "angelina_k": {"first_place_team_reward": 0.5}, "aubry_b": {"first_place_team_reward": 0.5}, "charlie_d": {"first_place_team_reward": 1.0, "first_place_team_immunity": 1.0}, "chrissy_h": {"first_place_team_reward": 1.0, "first_place_team_immunity": 1.0}, "christian_h": {"1st_to_make_fire_for_their_tribe": 5.0, "last_place_team_immunity": -1.0, "last_place_team_reward": -0.5, "receives_zero_votes_at_tribal": 2.0, "correct_vote": 3.0}, "cirie_f": {"blamed_for_team_loss": -2.0, "last_place_team_immunity": -1.0, "last_place_team_reward": -0.5, "receives_a_vote": -1.0, "correct_vote": 3.0}, "colby_d": {"loses_vote_due_to_risk": -2.0, "volunteers_for_journey___risk": 1.0, "first_place_team_reward": 0.5}, "dee_v": {"first_place_team_reward": 1.0, "first_place_team_immunity": 1.0}, "emily_f": {"last_place_team_immunity": -1.0, "last_place_team_reward": -0.5, "receives_zero_votes_at_tribal": 2.0, "correct_vote": 3.0}, "genevieve_m": {"finds_hidden_immunity_idol": 3.0, "first_place_team_reward": 0.5}, "jenna_l": {"last_place_team_immunity": -1.0, "last_place_team_reward": -0.5, "eliminated": -10.0, "receives_a_vote": -7.0}, "joe_h": {"last_place_team_immunity": -1.0, "last_place_team_reward": -0.5, "receives_zero_votes_at_tribal": 2.0, "correct_vote": 3.0}, "jonathan_y": {"first_place_team_reward": 1.0, "first_place_team_immunity": 1.0}, "kamilla_k": {"first_place_team_reward": 1.0, "first_place_team_immunity": 1.0}, "kyle_f": {"first_place_team_reward": 0.5, "eliminated": -10.0}, "mike_w": {"volunteers_for_journey___risk": 1.0, "first_place_team_reward": 1.0, "first_place_team_immunity": 1.0}, "ozzy_l": {"gains_advantage___idol": 4.0, "last_place_team_immunity": -1.0, "last_place_team_reward": -0.5, "receives_zero_votes_at_tribal": 2.0, "correct_vote": 3.0}, "q_burdette": {"loses_vote_due_to_risk": -2.0, "gains_advantage___idol": 2.0, "first_place_team_reward": 0.5}, "rick_d": {"last_place_team_immunity": -1.0, "last_place_team_reward": -0.5, "receives_zero_votes_at_tribal": 2.0, "correct_vote": 3.0}, "rizo_v": {"first_place_team_reward": 0.5}, "savannah_l": {"volunteers_for_journey___risk": 1.0, "gains_advantage___idol": 2.0, "last_place_team_immunity": -1.0, "last_place_team_reward": -0.5, "receives_zero_votes_at_tribal": 2.0, "correct_vote": 3.0}, "stephenie_k": {"first_place_team_reward": 0.5}, "tiffany_e": {"first_place_team_reward": 1.0, "first_place_team_immunity": 1.0}}, "2": {"angelina_k": {"last_place_team_reward": -0.5, "first_place_team_immunity": 1.0}, "aubry_b": {"gains_advantage___idol": 2.0, "last_place_team_reward": -0.5, "first_place_team_immunity": 1.0}, "christian_h": {"finds_hidden_immunity_idol": 3.0, "last_place_team_immunity": -1.0, "first_place_team_reward": 0.5, "receives_zero_votes_at_tribal": 2.0, "correct_vote": 3.0}, "cirie_f": {"last_place_team_immunity": -1.0, "first_place_team_reward": 0.5, "receives_zero_votes_at_tribal": 2.0, "correct_vote": 3.0}, "colby_d": {"last_place_team_reward": -0.5, "first_place_team_immunity": 1.0}, "emily_f": {"last_place_team_immunity": -1.0, "first_place_team_reward": 0.5, "receives_zero_votes_at_tribal": 2.0, "correct_vote": 3.0}, "genevieve_m": {"last_place_team_reward": -0.5, "first_place_team_immunity": 1.0}, "joe_h": {"last_place_team_immunity": -1.0, "first_place_team_reward": 0.5, "receives_zero_votes_at_tribal": 2.0, "correct_vote": 3.0}, "ozzy_l": {"last_place_team_immunity": -1.0, "first_place_team_reward": 0.5, "receives_a_vote": -1.0, "correct_vote": 3.0}, "q_burdette": {"last_place_team_reward": -0.5, "first_place_team_immunity": 1.0}, "rick_d": {"last_place_team_immunity": -1.0, "first_place_team_reward": 0.5, "receives_zero_votes_at_tribal": 2.0, "correct_vote": 3.0}, "rizo_v": {"last_place_team_reward": -0.5, "first_place_team_immunity": 1.0}, "savannah_l": {"last_place_team_immunity": -1.0, "first_place_team_reward": 0.5, "eliminated": -10.0, "receives_a_vote": -5.0}, "stephenie_k": {"last_place_team_reward": -0.5, "first_place_team_immunity": 1.0}}}, "currentWeek": 2, "createdAt": 1700000000000, "tribes": {"Cila": ["christian_h", "cirie_f", "emily_f", "joe_h", "ozzy_l", "rick_d", "jenna_l", "savannah_l"], "Kalo": ["charlie_d", "chrissy_h", "coach", "dee_v", "jonathan_y", "kamilla_k", "mike_w", "tiffany_e", "kyle_f"], "Vatu": ["angelina_k", "aubry_b", "colby_d", "genevieve_m", "q_burdette", "rizo_v", "stephenie_k"]}, "tribeColors": {"Cila": "#f5923e", "Kalo": "#2ec4b6", "Vatu": "#c44bbe"}}, {"id": "tc_import_s22", "name": "Fantasy Top Chef", "showType": "top_chef", "showName": "Top Chef", "seasonName": "Season 22", "format": "captains", "captainsConfig": {"regularSlots": 3}, "standardConfig": null, "scoringRules": [{"id": "money_earned_per_1k", "label": "Money Earned (per $1K)", "points": 0.2, "category": "competition"}, {"id": "favorite_dish_in_quickfire", "label": "Favorite Dish in QuickFire", "points": 1.0, "category": "competition"}, {"id": "favorite_dish_in_elimination", "label": "Favorite Dish in Elimination", "points": 2.0, "category": "competition"}, {"id": "win_quickfire", "label": "Win QuickFire", "points": 2.0, "category": "competition"}, {"id": "win_elimination", "label": "Win Elimination", "points": 3.0, "category": "competition"}, {"id": "win_restaurant_wars", "label": "Win Restaurant Wars", "points": 20.0, "category": "competition"}, {"id": "return_from_last_chance_kitchen", "label": "Return from Last Chance Kitchen", "points": 25.0, "category": "competition"}, {"id": "final_3", "label": "Final 3", "points": 25.0, "category": "competition"}, {"id": "winner_of_the_show", "label": "Winner of the Show", "points": 25.0, "category": "competition"}, {"id": "least_favorite_dish_in_quickfire", "label": "Least Favorite Dish in QuickFire", "points": -1.0, "category": "competition"}, {"id": "least_favorite_dish_in_elimination", "label": "Least Favorite Dish in Elimination", "points": -2.0, "category": "competition"}, {"id": "cuts_self", "label": "Cuts Self", "points": -1.0, "category": "competition"}, {"id": "fails_to_get_all_components_on_plate", "label": "Fails to Get All Components on Plate", "points": -1.0, "category": "competition"}, {"id": "entirely_empty_plate", "label": "Entirely Empty Plate", "points": -2.0, "category": "competition"}, {"id": "eliminated", "label": "Eliminated", "points": -8.0, "category": "competition"}], "contestants": [{"id": "anya_e", "name": "Anya E", "bio": "", "gender": "", "status": "eliminated", "eliminatedWeek": 3}, {"id": "bailey_s", "name": "Bailey S", "bio": "", "gender": "", "status": "eliminated", "eliminatedWeek": 2}, {"id": "cesar_m", "name": "Cesar M", "bio": "", "gender": "", "status": "eliminated", "eliminatedWeek": 9}, {"id": "corwin_h", "name": "Corwin H", "bio": "", "gender": "", "status": "eliminated", "eliminatedWeek": 5}, {"id": "henry_l", "name": "Henry L", "bio": "", "gender": "", "status": "eliminated", "eliminatedWeek": 7}, {"id": "kat_t", "name": "Kat T", "bio": "", "gender": "", "status": "eliminated", "eliminatedWeek": 5}, {"id": "katianna_h", "name": "Katianna H", "bio": "", "gender": "", "status": "eliminated", "eliminatedWeek": 6}, {"id": "lana_l", "name": "Lana L", "bio": "", "gender": "", "status": "eliminated", "eliminatedWeek": 11}, {"id": "massimo_p", "name": "Massimo P", "bio": "", "gender": "", "status": "eliminated", "eliminatedWeek": 12}, {"id": "mimi_w", "name": "Mimi W", "bio": "", "gender": "", "status": "eliminated", "eliminatedWeek": 1}, {"id": "paula_e", "name": "Paula E", "bio": "", "gender": "", "status": "eliminated", "eliminatedWeek": 8}, {"id": "shuai_w", "name": "Shuai W", "bio": "", "gender": "", "status": "active"}, {"id": "tristen_e", "name": "Tristen E", "bio": "", "gender": "", "status": "active"}, {"id": "vinny_l", "name": "Vinny L", "bio": "", "gender": "", "status": "eliminated", "eliminatedWeek": 10}, {"id": "zubair_m", "name": "Zubair M", "bio": "", "gender": "", "status": "eliminated", "eliminatedWeek": 4}], "teams": [{"id": "alex", "name": "Team Alex", "owner": "Alex", "depthChart": {"captain": "shuai_w", "coCaptain": "tristen_e", "regulars": []}, "weeklyRosters": {}, "weeklyDepthCharts": {"1": {"captain": "zubair_m", "coCaptain": "kat_t", "regulars": ["cesar_m", "henry_l", "corwin_h"]}, "2": {"captain": "vinny_l", "coCaptain": "cesar_m", "regulars": ["zubair_m", "henry_l", "corwin_h"]}, "3": {"captain": "vinny_l", "coCaptain": "cesar_m", "regulars": ["zubair_m", "henry_l", "massimo_p"]}, "4": {"captain": "vinny_l", "coCaptain": "katianna_h", "regulars": ["zubair_m", "henry_l", "cesar_m"]}, "5": {"captain": "vinny_l", "coCaptain": "katianna_h", "regulars": ["shuai_w", "henry_l", "cesar_m"]}, "6": {"captain": "katianna_h", "coCaptain": "paula_e", "regulars": ["shuai_w", "vinny_l", "cesar_m"]}, "7": {"captain": "tristen_e", "coCaptain": "cesar_m", "regulars": ["shuai_w", "paula_e", "katianna_h"]}, "8": {"captain": "tristen_e", "coCaptain": "katianna_h", "regulars": ["shuai_w", "paula_e", "cesar_m"]}, "9": {"captain": "katianna_h", "coCaptain": "tristen_e", "regulars": ["cesar_m", "shuai_w", "vinny_l"]}, "10": {"captain": "tristen_e", "coCaptain": "vinny_l", "regulars": ["cesar_m", "shuai_w"]}, "11": {"captain": "tristen_e", "coCaptain": "cesar_m", "regulars": ["shuai_w"]}, "12": {"captain": "shuai_w", "coCaptain": "tristen_e", "regulars": ["cesar_m"]}, "13": {"captain": "shuai_w", "coCaptain": "tristen_e", "regulars": ["cesar_m"]}, "14": {"captain": "shuai_w", "coCaptain": "tristen_e", "regulars": []}}}, {"id": "amber", "name": "Team Amber", "owner": "Amber", "depthChart": {"captain": "tristen_e", "coCaptain": null, "regulars": []}, "weeklyRosters": {}, "weeklyDepthCharts": {"1": {"captain": "henry_l", "coCaptain": "katianna_h", "regulars": ["tristen_e", "massimo_p", "mimi_w"]}, "2": {"captain": "katianna_h", "coCaptain": "henry_l", "regulars": ["anya_e", "massimo_p", "tristen_e"]}, "3": {"captain": "katianna_h", "coCaptain": "henry_l", "regulars": ["anya_e", "vinny_l", "tristen_e"]}, "4": {"captain": "katianna_h", "coCaptain": "henry_l", "regulars": ["zubair_m", "tristen_e", "vinny_l"]}, "5": {"captain": "tristen_e", "coCaptain": "henry_l", "regulars": ["corwin_h", "katianna_h", "vinny_l"]}, "6": {"captain": "tristen_e", "coCaptain": "henry_l", "regulars": ["corwin_h", "katianna_h", "cesar_m"]}, "7": {"captain": "tristen_e", "coCaptain": "henry_l", "regulars": ["corwin_h", "massimo_p", "cesar_m"]}, "8": {"captain": "tristen_e", "coCaptain": "vinny_l", "regulars": ["corwin_h", "massimo_p", "cesar_m"]}, "9": {"captain": "tristen_e", "coCaptain": "vinny_l", "regulars": ["katianna_h", "massimo_p", "cesar_m"]}, "10": {"captain": "tristen_e", "coCaptain": "vinny_l", "regulars": ["massimo_p", "cesar_m"]}, "11": {"captain": "tristen_e", "coCaptain": "massimo_p", "regulars": ["cesar_m"]}, "12": {"captain": "tristen_e", "coCaptain": "massimo_p", "regulars": ["cesar_m"]}, "13": {"captain": "tristen_e", "coCaptain": "cesar_m", "regulars": []}, "14": {"captain": "tristen_e", "coCaptain": null, "regulars": []}}}, {"id": "lana", "name": "Team Lana", "owner": "Lana", "depthChart": {"captain": "tristen_e", "coCaptain": null, "regulars": []}, "weeklyRosters": {}, "weeklyDepthCharts": {"1": {"captain": "henry_l", "coCaptain": "kat_t", "regulars": ["tristen_e", "shuai_w", "zubair_m"]}, "2": {"captain": "henry_l", "coCaptain": "shuai_w", "regulars": ["tristen_e", "zubair_m", "katianna_h"]}, "3": {"captain": "henry_l", "coCaptain": "shuai_w", "regulars": ["katianna_h", "zubair_m", "tristen_e"]}, "4": {"captain": "shuai_w", "coCaptain": "zubair_m", "regulars": ["henry_l", "tristen_e", "katianna_h"]}, "5": {"captain": "shuai_w", "coCaptain": "tristen_e", "regulars": ["katianna_h", "henry_l", "vinny_l"]}, "6": {"captain": "shuai_w", "coCaptain": "katianna_h", "regulars": ["tristen_e", "henry_l", "cesar_m"]}, "7": {"captain": "tristen_e", "coCaptain": "cesar_m", "regulars": ["henry_l", "shuai_w", "lana_l"]}, "8": {"captain": "tristen_e", "coCaptain": "katianna_h", "regulars": ["lana_l", "shuai_w", "cesar_m"]}, "9": {"captain": "katianna_h", "coCaptain": "tristen_e", "regulars": ["lana_l", "cesar_m", "vinny_l"]}, "10": {"captain": "tristen_e", "coCaptain": "lana_l", "regulars": ["cesar_m", "vinny_l"]}, "11": {"captain": "lana_l", "coCaptain": "tristen_e", "regulars": ["cesar_m"]}, "12": {"captain": "tristen_e", "coCaptain": "cesar_m", "regulars": []}, "13": {"captain": "tristen_e", "coCaptain": "cesar_m", "regulars": []}, "14": {"captain": "tristen_e", "coCaptain": null, "regulars": []}}}, {"id": "nick", "name": "Team Nick", "owner": "Nick", "depthChart": {"captain": "tristen_e", "coCaptain": null, "regulars": []}, "weeklyRosters": {}, "weeklyDepthCharts": {"1": {"captain": "zubair_m", "coCaptain": "anya_e", "regulars": ["massimo_p", "katianna_h", "henry_l"]}, "2": {"captain": "katianna_h", "coCaptain": "vinny_l", "regulars": ["massimo_p", "zubair_m", "anya_e"]}, "3": {"captain": "katianna_h", "coCaptain": "vinny_l", "regulars": ["massimo_p", "cesar_m", "anya_e"]}, "4": {"captain": "shuai_w", "coCaptain": "katianna_h", "regulars": ["massimo_p", "cesar_m", "vinny_l"]}, "5": {"captain": "shuai_w", "coCaptain": "katianna_h", "regulars": ["tristen_e", "cesar_m", "vinny_l"]}, "6": {"captain": "cesar_m", "coCaptain": "tristen_e", "regulars": ["katianna_h", "shuai_w", "vinny_l"]}, "7": {"captain": "cesar_m", "coCaptain": "tristen_e", "regulars": ["lana_l", "shuai_w", "vinny_l"]}, "8": {"captain": "tristen_e", "coCaptain": "massimo_p", "regulars": ["cesar_m", "shuai_w", "vinny_l"]}, "9": {"captain": "tristen_e", "coCaptain": "cesar_m", "regulars": ["massimo_p", "lana_l", "vinny_l"]}, "10": {"captain": "tristen_e", "coCaptain": "massimo_p", "regulars": ["cesar_m", "lana_l", "vinny_l"]}, "11": {"captain": "tristen_e", "coCaptain": "massimo_p", "regulars": ["cesar_m", "lana_l"]}, "12": {"captain": "tristen_e", "coCaptain": "massimo_p", "regulars": ["cesar_m"]}, "13": {"captain": "tristen_e", "coCaptain": "cesar_m", "regulars": []}, "14": {"captain": "tristen_e", "coCaptain": null, "regulars": []}}}, {"id": "nikki", "name": "Team Nikki", "owner": "Nikki", "depthChart": {"captain": "tristen_e", "coCaptain": null, "regulars": []}, "weeklyRosters": {}, "weeklyDepthCharts": {"1": {"captain": "bailey_s", "coCaptain": "katianna_h", "regulars": ["henry_l", "cesar_m", "mimi_w"]}, "2": {"captain": "anya_e", "coCaptain": "katianna_h", "regulars": ["henry_l", "cesar_m", "bailey_s"]}, "3": {"captain": "anya_e", "coCaptain": "katianna_h", "regulars": ["henry_l", "cesar_m", "vinny_l"]}, "4": {"captain": "katianna_h", "coCaptain": "massimo_p", "regulars": ["henry_l", "cesar_m", "vinny_l"]}, "5": {"captain": "katianna_h", "coCaptain": "massimo_p", "regulars": ["henry_l", "cesar_m", "vinny_l"]}, "6": {"captain": "katianna_h", "coCaptain": "massimo_p", "regulars": ["henry_l", "cesar_m", "lana_l"]}, "7": {"captain": "massimo_p", "coCaptain": "paula_e", "regulars": ["henry_l", "cesar_m", "lana_l"]}, "8": {"captain": "tristen_e", "coCaptain": "lana_l", "regulars": ["massimo_p", "cesar_m", "paula_e"]}, "9": {"captain": "tristen_e", "coCaptain": "lana_l", "regulars": ["massimo_p", "vinny_l", "katianna_h"]}, "10": {"captain": "tristen_e", "coCaptain": "lana_l", "regulars": ["massimo_p", "vinny_l"]}, "11": {"captain": "tristen_e", "coCaptain": "lana_l", "regulars": ["massimo_p"]}, "12": {"captain": "tristen_e", "coCaptain": null, "regulars": ["massimo_p"]}, "13": {"captain": "tristen_e", "coCaptain": null, "regulars": []}, "14": {"captain": "tristen_e", "coCaptain": null, "regulars": []}}}, {"id": "scott", "name": "Team Scott", "owner": "Scott", "depthChart": {"captain": "tristen_e", "coCaptain": null, "regulars": []}, "weeklyRosters": {}, "weeklyDepthCharts": {"1": {"captain": "lana_l", "coCaptain": "cesar_m", "regulars": ["katianna_h", "henry_l", "tristen_e"]}, "2": {"captain": "cesar_m", "coCaptain": "paula_e", "regulars": ["tristen_e", "katianna_h", "lana_l"]}, "3": {"captain": "cesar_m", "coCaptain": "paula_e", "regulars": ["tristen_e", "katianna_h", "massimo_p"]}, "4": {"captain": "katianna_h", "coCaptain": "tristen_e", "regulars": ["cesar_m", "paula_e", "shuai_w"]}, "5": {"captain": "cesar_m", "coCaptain": "katianna_h", "regulars": ["tristen_e", "shuai_w", "lana_l"]}, "6": {"captain": "cesar_m", "coCaptain": "lana_l", "regulars": ["paula_e", "katianna_h", "tristen_e"]}, "7": {"captain": "cesar_m", "coCaptain": "lana_l", "regulars": ["tristen_e", "paula_e", "shuai_w"]}, "8": {"captain": "massimo_p", "coCaptain": "tristen_e", "regulars": ["lana_l", "paula_e", "cesar_m"]}, "9": {"captain": "massimo_p", "coCaptain": "lana_l", "regulars": ["tristen_e", "katianna_h", "cesar_m"]}, "10": {"captain": "lana_l", "coCaptain": "massimo_p", "regulars": ["tristen_e", "cesar_m"]}, "11": {"captain": "cesar_m", "coCaptain": "lana_l", "regulars": ["tristen_e", "massimo_p"]}, "12": {"captain": "cesar_m", "coCaptain": "massimo_p", "regulars": ["tristen_e"]}, "13": {"captain": "cesar_m", "coCaptain": null, "regulars": ["tristen_e"]}, "14": {"captain": "tristen_e", "coCaptain": null, "regulars": []}}}, {"id": "steve", "name": "Team Steve", "owner": "Steve", "depthChart": {"captain": "bailey_s", "coCaptain": "tristen_e", "regulars": []}, "weeklyRosters": {}, "weeklyDepthCharts": {"1": {"captain": "katianna_h", "coCaptain": "corwin_h", "regulars": ["anya_e", "zubair_m", "cesar_m"]}, "2": {"captain": "cesar_m", "coCaptain": "vinny_l", "regulars": ["anya_e", "katianna_h", "zubair_m"]}, "3": {"captain": "cesar_m", "coCaptain": "vinny_l", "regulars": ["anya_e", "katianna_h", "zubair_m"]}, "4": {"captain": "katianna_h", "coCaptain": "vinny_l", "regulars": ["shuai_w", "cesar_m", "zubair_m"]}, "5": {"captain": "katianna_h", "coCaptain": "cesar_m", "regulars": ["shuai_w", "vinny_l", "bailey_s"]}, "6": {"captain": "tristen_e", "coCaptain": "katianna_h", "regulars": ["shuai_w", "cesar_m", "bailey_s"]}, "7": {"captain": "tristen_e", "coCaptain": "cesar_m", "regulars": ["shuai_w", "paula_e", "bailey_s"]}, "8": {"captain": "tristen_e", "coCaptain": "cesar_m", "regulars": ["shuai_w", "paula_e", "bailey_s"]}, "9": {"captain": "tristen_e", "coCaptain": "katianna_h", "regulars": ["bailey_s", "cesar_m", "lana_l"]}, "10": {"captain": "tristen_e", "coCaptain": "lana_l", "regulars": ["bailey_s", "cesar_m"]}, "11": {"captain": "tristen_e", "coCaptain": "cesar_m", "regulars": ["bailey_s", "lana_l"]}, "12": {"captain": "tristen_e", "coCaptain": "cesar_m", "regulars": []}, "13": {"captain": "tristen_e", "coCaptain": "cesar_m", "regulars": ["bailey_s"]}, "14": {"captain": "bailey_s", "coCaptain": "tristen_e", "regulars": []}}}, {"id": "zach", "name": "Team Zach", "owner": "Zach", "depthChart": {"captain": "tristen_e", "coCaptain": null, "regulars": []}, "weeklyRosters": {}, "weeklyDepthCharts": {"1": {"captain": "katianna_h", "coCaptain": "zubair_m", "regulars": ["henry_l", "bailey_s", "massimo_p"]}, "2": {"captain": "cesar_m", "coCaptain": "katianna_h", "regulars": ["zubair_m", "henry_l", "massimo_p"]}, "3": {"captain": "cesar_m", "coCaptain": "massimo_p", "regulars": ["zubair_m", "katianna_h", "vinny_l"]}, "4": {"captain": "katianna_h", "coCaptain": "massimo_p", "regulars": ["zubair_m", "cesar_m", "vinny_l"]}, "5": {"captain": "katianna_h", "coCaptain": "vinny_l", "regulars": ["corwin_h", "cesar_m", "massimo_p"]}, "6": {"captain": "katianna_h", "coCaptain": "cesar_m", "regulars": ["tristen_e", "vinny_l", "massimo_p"]}, "7": {"captain": "vinny_l", "coCaptain": "cesar_m", "regulars": ["tristen_e", "massimo_p", "paula_e"]}, "8": {"captain": "tristen_e", "coCaptain": "vinny_l", "regulars": ["cesar_m", "massimo_p", "shuai_w"]}, "9": {"captain": "vinny_l", "coCaptain": "tristen_e", "regulars": ["cesar_m", "massimo_p", "lana_l"]}, "10": {"captain": "vinny_l", "coCaptain": "tristen_e", "regulars": ["cesar_m", "massimo_p", "lana_l"]}, "11": {"captain": "tristen_e", "coCaptain": "massimo_p", "regulars": ["cesar_m", "lana_l"]}, "12": {"captain": "tristen_e", "coCaptain": "massimo_p", "regulars": ["cesar_m"]}, "13": {"captain": "tristen_e", "coCaptain": "cesar_m", "regulars": []}, "14": {"captain": "tristen_e", "coCaptain": null, "regulars": []}}}], "weeklyScores": {"1": {"anya_e": {"favorite_dish_in_elimination": 2.0}, "bailey_s": {"least_favorite_dish_in_elimination": -2.0}, "cesar_m": {"money_earned_per_1k": 1.0, "favorite_dish_in_quickfire": 1.0, "favorite_dish_in_elimination": 2.0, "win_quickfire": 2.0}, "henry_l": {"favorite_dish_in_elimination": 2.0}, "kat_t": {"least_favorite_dish_in_elimination": -2.0, "fails_to_get_all_components_on_plate": -1.0}, "katianna_h": {"money_earned_per_1k": 1.0, "favorite_dish_in_quickfire": 1.0, "win_quickfire": 2.0}, "lana_l": {"favorite_dish_in_quickfire": 1.0}, "massimo_p": {"favorite_dish_in_quickfire": 1.0, "least_favorite_dish_in_elimination": -2.0}, "mimi_w": {"money_earned_per_1k": 1.0, "favorite_dish_in_quickfire": 1.0, "win_quickfire": 2.0, "least_favorite_dish_in_elimination": -2.0, "eliminated": -8.0}, "paula_e": {"favorite_dish_in_quickfire": 1.0, "least_favorite_dish_in_elimination": -2.0}, "shuai_w": {"favorite_dish_in_quickfire": 1.0, "favorite_dish_in_elimination": 2.0}, "tristen_e": {"favorite_dish_in_quickfire": 1.0, "fails_to_get_all_components_on_plate": -1.0}, "vinny_l": {"favorite_dish_in_quickfire": 1.0, "favorite_dish_in_elimination": 2.0, "win_elimination": 3.0}}, "2": {"anya_e": {"favorite_dish_in_elimination": 2.0}, "bailey_s": {"least_favorite_dish_in_quickfire": -1.0, "least_favorite_dish_in_elimination": -2.0, "eliminated": -8.0}, "cesar_m": {"money_earned_per_1k": 1.0}, "corwin_h": {"money_earned_per_1k": 1.0, "least_favorite_dish_in_elimination": -2.0, "fails_to_get_all_components_on_plate": -1.0}, "henry_l": {"least_favorite_dish_in_quickfire": -1.0, "least_favorite_dish_in_elimination": -2.0}, "kat_t": {"favorite_dish_in_quickfire": 1.0}, "lana_l": {"money_earned_per_1k": 1.0}, "massimo_p": {"favorite_dish_in_quickfire": 1.0}, "paula_e": {"money_earned_per_1k": 1.0, "least_favorite_dish_in_quickfire": -1.0}, "shuai_w": {"money_earned_per_1k": 2.0, "favorite_dish_in_quickfire": 1.0, "favorite_dish_in_elimination": 2.0, "win_quickfire": 2.0}, "tristen_e": {"money_earned_per_1k": 1.0}, "zubair_m": {"money_earned_per_1k": 1.0, "favorite_dish_in_elimination": 2.0, "win_elimination": 3.0}}, "3": {"anya_e": {"least_favorite_dish_in_elimination": -2.0, "eliminated": -8.0}, "cesar_m": {"least_favorite_dish_in_quickfire": -1.0}, "corwin_h": {"favorite_dish_in_elimination": 2.0}, "kat_t": {"least_favorite_dish_in_quickfire": -1.0}, "katianna_h": {"money_earned_per_1k": 2.0, "favorite_dish_in_quickfire": 1.0, "favorite_dish_in_elimination": 2.0, "win_quickfire": 2.0, "win_elimination": 3.0}, "massimo_p": {"least_favorite_dish_in_quickfire": -1.0, "least_favorite_dish_in_elimination": -2.0}, "paula_e": {"least_favorite_dish_in_elimination": -2.0}, "shuai_w": {"favorite_dish_in_quickfire": 1.0}, "tristen_e": {"favorite_dish_in_elimination": 2.0}, "zubair_m": {"favorite_dish_in_quickfire": 1.0}}, "4": {"bailey_s": {"return_from_last_chance_kitchen": 25.0}, "corwin_h": {"money_earned_per_1k": 2.0, "favorite_dish_in_quickfire": 1.0, "favorite_dish_in_elimination": 2.0, "win_quickfire": 2.0}, "henry_l": {"least_favorite_dish_in_quickfire": -1.0, "least_favorite_dish_in_elimination": -2.0, "fails_to_get_all_components_on_plate": -1.0}, "kat_t": {"favorite_dish_in_quickfire": 1.0, "favorite_dish_in_elimination": 2.0}, "massimo_p": {"least_favorite_dish_in_quickfire": -1.0}, "shuai_w": {"favorite_dish_in_quickfire": 1.0, "least_favorite_dish_in_elimination": -2.0}, "tristen_e": {"favorite_dish_in_elimination": 2.0, "win_elimination": 3.0, "least_favorite_dish_in_quickfire": -1.0}, "zubair_m": {"least_favorite_dish_in_elimination": -2.0, "eliminated": -8.0}}, "5": {"bailey_s": {"favorite_dish_in_elimination": 2.0, "win_elimination": 3.0}, "cesar_m": {"favorite_dish_in_elimination": 2.0}, "corwin_h": {"least_favorite_dish_in_elimination": -2.0, "eliminated": -8.0}, "kat_t": {"least_favorite_dish_in_elimination": -2.0, "eliminated": -8.0}, "katianna_h": {"favorite_dish_in_elimination": 2.0}, "lana_l": {"least_favorite_dish_in_elimination": -2.0}, "tristen_e": {"favorite_dish_in_elimination": 2.0, "win_elimination": 3.0}, "vinny_l": {"least_favorite_dish_in_elimination": -2.0}}, "6": {"cesar_m": {"favorite_dish_in_quickfire": 1.0, "favorite_dish_in_elimination": 2.0}, "henry_l": {"least_favorite_dish_in_quickfire": -1.0, "least_favorite_dish_in_elimination": -2.0}, "katianna_h": {"least_favorite_dish_in_elimination": -2.0, "eliminated": -8.0}, "lana_l": {"favorite_dish_in_elimination": 2.0}, "massimo_p": {"favorite_dish_in_quickfire": 1.0, "favorite_dish_in_elimination": 2.0, "win_elimination": 3.0}, "paula_e": {"favorite_dish_in_quickfire": 1.0, "favorite_dish_in_elimination": 2.0}, "shuai_w": {"least_favorite_dish_in_quickfire": -1.0, "least_favorite_dish_in_elimination": -2.0}, "tristen_e": {"money_earned_per_1k": 2.0, "favorite_dish_in_quickfire": 1.0, "favorite_dish_in_elimination": 2.0, "win_quickfire": 2.0}, "vinny_l": {"least_favorite_dish_in_quickfire": -1.0}}, "7": {"bailey_s": {"least_favorite_dish_in_quickfire": -1.0}, "cesar_m": {"least_favorite_dish_in_quickfire": -1.0, "least_favorite_dish_in_elimination": -2.0}, "henry_l": {"money_earned_per_1k": 2.0, "favorite_dish_in_quickfire": 1.0, "win_quickfire": 2.0, "least_favorite_dish_in_elimination": -2.0, "eliminated": -8.0}, "massimo_p": {"favorite_dish_in_quickfire": 1.0}, "paula_e": {"least_favorite_dish_in_quickfire": -1.0, "least_favorite_dish_in_elimination": -2.0}, "shuai_w": {"favorite_dish_in_elimination": 2.0}, "tristen_e": {"favorite_dish_in_quickfire": 1.0, "favorite_dish_in_elimination": 2.0, "win_elimination": 3.0}, "vinny_l": {"favorite_dish_in_elimination": 2.0}}, "8": {"bailey_s": {"least_favorite_dish_in_elimination": -2.0}, "cesar_m": {"least_favorite_dish_in_elimination": -2.0}, "lana_l": {"money_earned_per_1k": 2.0, "favorite_dish_in_elimination": 2.0}, "massimo_p": {"money_earned_per_1k": 2.0, "favorite_dish_in_elimination": 2.0}, "paula_e": {"least_favorite_dish_in_elimination": -2.0, "eliminated": -8.0}, "shuai_w": {"least_favorite_dish_in_elimination": -2.0}, "tristen_e": {"money_earned_per_1k": 2.0, "favorite_dish_in_elimination": 2.0, "win_restaurant_wars": 20.0}, "vinny_l": {"money_earned_per_1k": 2.0, "favorite_dish_in_elimination": 2.0}}, "9": {"bailey_s": {"favorite_dish_in_elimination": 2.0, "least_favorite_dish_in_quickfire": -1.0}, "cesar_m": {"return_from_last_chance_kitchen": 25.0, "least_favorite_dish_in_quickfire": -1.0, "least_favorite_dish_in_elimination": -2.0, "eliminated": -8.0}, "lana_l": {"money_earned_per_1k": 2.0, "favorite_dish_in_quickfire": 1.0, "win_quickfire": 2.0, "least_favorite_dish_in_elimination": -2.0}, "massimo_p": {"money_earned_per_1k": 2.0, "favorite_dish_in_elimination": 2.0, "win_elimination": 3.0, "least_favorite_dish_in_quickfire": -1.0}, "shuai_w": {"favorite_dish_in_quickfire": 1.0}, "tristen_e": {"favorite_dish_in_quickfire": 1.0, "favorite_dish_in_elimination": 2.0}, "vinny_l": {"favorite_dish_in_quickfire": 1.0, "least_favorite_dish_in_elimination": -2.0}}, "10": {"bailey_s": {"favorite_dish_in_elimination": 2.0, "least_favorite_dish_in_quickfire": -1.0}, "cesar_m": {"money_earned_per_1k": 2.0, "favorite_dish_in_quickfire": 1.0, "win_quickfire": 2.0, "least_favorite_dish_in_elimination": -2.0}, "lana_l": {"least_favorite_dish_in_quickfire": -1.0, "least_favorite_dish_in_elimination": -2.0}, "massimo_p": {"favorite_dish_in_quickfire": 1.0, "favorite_dish_in_elimination": 2.0}, "shuai_w": {"favorite_dish_in_quickfire": 1.0, "favorite_dish_in_elimination": 2.0, "win_elimination": 3.0}, "tristen_e": {"least_favorite_dish_in_quickfire": -1.0, "least_favorite_dish_in_elimination": -2.0}, "vinny_l": {"least_favorite_dish_in_quickfire": -1.0, "least_favorite_dish_in_elimination": -2.0, "fails_to_get_all_components_on_plate": -1.0, "eliminated": -8.0}}, "11": {"bailey_s": {"favorite_dish_in_quickfire": 1.0, "least_favorite_dish_in_elimination": -2.0}, "cesar_m": {"least_favorite_dish_in_quickfire": -1.0, "least_favorite_dish_in_elimination": -2.0}, "lana_l": {"least_favorite_dish_in_quickfire": -1.0, "least_favorite_dish_in_elimination": -2.0, "eliminated": -8.0}, "massimo_p": {"favorite_dish_in_elimination": 2.0, "win_elimination": 3.0, "least_favorite_dish_in_quickfire": -1.0}, "shuai_w": {"money_earned_per_1k": 2.0, "favorite_dish_in_quickfire": 1.0, "favorite_dish_in_elimination": 2.0, "win_quickfire": 2.0}, "tristen_e": {"favorite_dish_in_quickfire": 1.0, "favorite_dish_in_elimination": 2.0}}, "12": {"bailey_s": {"least_favorite_dish_in_elimination": -2.0}, "massimo_p": {"least_favorite_dish_in_elimination": -2.0, "eliminated": -8.0}, "shuai_w": {"money_earned_per_1k": 2.0, "favorite_dish_in_elimination": 2.0, "win_elimination": 3.0}, "tristen_e": {"favorite_dish_in_elimination": 2.0}}, "13": {"bailey_s": {"final_3": 25.0}, "cesar_m": {"eliminated": -8.0}, "shuai_w": {"money_earned_per_1k": 3.0, "favorite_dish_in_elimination": 2.0, "final_3": 25.0}, "tristen_e": {"money_earned_per_1k": 3.0, "win_quickfire": 2.0, "final_3": 25.0}}, "14": {"tristen_e": {"winner_of_the_show": 25.0}}}, "currentWeek": 14, "createdAt": 1700000000000}, {"id": "tc_s23", "name": "Fantasy Top Chef", "showType": "top_chef", "showName": "Top Chef", "seasonName": "Season 23", "format": "captains", "captainsConfig": {"regularSlots": 3}, "standardConfig": null, "scoringRules": [{"id": "money_earned_per_1k", "label": "Money Earned (per $1K)", "points": 0.2, "category": "competition"}, {"id": "favorite_dish_in_quickfire", "label": "Favorite Dish in QuickFire", "points": 1.0, "category": "competition"}, {"id": "favorite_dish_in_elimination", "label": "Favorite Dish in Elimination", "points": 2.0, "category": "competition"}, {"id": "win_quickfire", "label": "Win QuickFire", "points": 2.0, "category": "competition"}, {"id": "win_elimination", "label": "Win Elimination", "points": 3.0, "category": "competition"}, {"id": "win_restaurant_wars", "label": "Win Restaurant Wars", "points": 20.0, "category": "competition"}, {"id": "return_from_last_chance_kitchen", "label": "Return from Last Chance Kitchen", "points": 25.0, "category": "competition"}, {"id": "final_3", "label": "Final 3", "points": 25.0, "category": "competition"}, {"id": "winner_of_the_show", "label": "Winner of the Show", "points": 25.0, "category": "competition"}, {"id": "least_favorite_dish_in_quickfire", "label": "Least Favorite Dish in QuickFire", "points": -1.0, "category": "competition"}, {"id": "least_favorite_dish_in_elimination", "label": "Least Favorite Dish in Elimination", "points": -2.0, "category": "competition"}, {"id": "cuts_self", "label": "Cuts Self", "points": -1.0, "category": "competition"}, {"id": "fails_to_get_all_components_on_plate", "label": "Fails to Get All Components on Plate", "points": -1.0, "category": "competition"}, {"id": "entirely_empty_plate", "label": "Entirely Empty Plate", "points": -2.0, "category": "competition"}, {"id": "eliminated", "label": "Eliminated", "points": -8.0, "category": "competition"}], "contestants": [{"id": "sieger_b", "name": "Sieger B.", "bio": "Sieger Bayer \u00b7 Chicago, IL \u00b7 Executive Chef/Owner at bar Berria \u00b7 Trained across Europe, worked at The Publican, Sqirl", "gender": "", "status": "active"}, {"id": "jassi_b", "name": "Jassi B.", "bio": "Jaspratap \"Jassi\" Bindra \u00b7 Houston, TX \u00b7 Executive Chef at Kahani Social Group \u00b7 Named World's Best Indian Chef 2019, Eater Houston Restaurant of the Year 2022", "gender": "", "status": "active"}, {"id": "sherry_c", "name": "Sherry C.", "bio": "Sherry Cardoso \u00b7 Brooklyn, NY \u00b7 Chef/Partner at Cynthia \u00b7 Trained at Le Cirque, Per Se under Thomas Keller, Brooklyn Fare", "gender": "", "status": "active"}, {"id": "brittany_c", "name": "Brittany C.", "bio": "Brittany Cochran \u00b7 Charlotte, NC \u00b7 Executive Chef at Stagioni \u00b7 Trained under Marc Forgione, worked at Michelin 2-star Marea", "gender": "", "status": "active"}, {"id": "brandon_d", "name": "Brandon D.", "bio": "Brandon Dearden \u00b7 Hamilton, MT \u00b7 Executive Chef/Co-Owner at Ember and Grano \u00b7 Identical twin of Jonathan, James Beard semifinalist, trained at Alinea", "gender": "", "status": "active"}, {"id": "jonathan_d", "name": "Jonathan D.", "bio": "Jonathan Dearden \u00b7 Alexandria, VA \u00b7 Corporate Chef at KNEAD Hospitality + Design \u00b7 Identical twin of Brandon, trained under Jos\u00e9 Andr\u00e9s", "gender": "", "status": "active"}, {"id": "oscar_d", "name": "Oscar D.", "bio": "Oscar Diaz \u00b7 Durham, NC \u00b7 Chef/Owner at Little Bull, AAKTUN, TaTaco \u00b7 2x James Beard semifinalist, Michelin Guide recommended, featured in Time Magazine", "gender": "", "status": "active"}, {"id": "duyen_h", "name": "Duyen H.", "bio": "Duyen Ha \u00b7 Los Angeles, CA \u00b7 Chef/Founder at The Cuisson \u00b7 Vietnamese-American, graduated top of class at Ferrandi Paris, trained at Arp\u00e8ge and Mirazur", "gender": "", "status": "active"}, {"id": "jennifer_j", "name": "Jennifer J.", "bio": "Jennifer Lee Jackson \u00b7 Suttons Bay, MI \u00b7 Consulting Chef \u00b7 CIA grad, trained at Chez Panisse and Prune, co-opened Voyager and Bunny Bunny with partner Justin", "gender": "", "status": "active"}, {"id": "anthony_j", "name": "Anthony J.", "bio": "Anthony Jones \u00b7 Alexandria, VA \u00b7 Executive Chef at Marcus DC \u00b7 James Beard semifinalist Emerging Chef, Eater DC Rising Chef 2025", "gender": "", "status": "active"}, {"id": "day_j", "name": "Day J.", "bio": "Day Ana\u00efs Joseph \u00b7 Atlanta, GA \u00b7 Executive Chef & Owner at Dine With Day \u00b7 Haitian-born, trained under Daniel Boulud, StarChefs Rising Star Award", "gender": "", "status": "active"}, {"id": "laurence_l", "name": "Laurence L.", "bio": "Laurence Louie \u00b7 Quincy, MA \u00b7 Chef/Owner at Rubato \u00b7 James Beard nominee Best Chef Northeast, Bon App\u00e9tit Best New Restaurants 2023", "gender": "", "status": "active"}, {"id": "rhoda_m", "name": "Rhoda M.", "bio": "Rhoda Magbitang \u00b7 Kailua-Kona, HI \u00b7 Executive Chef at CanoeHouse, Mauna Lani \u00b7 Filipino-American, trained at M\u00e9lisse, Bazaar by Jos\u00e9 Andr\u00e9s, Chateau Marmont", "gender": "", "status": "active"}, {"id": "justin_t", "name": "Justin T.", "bio": "Justin Tootla \u00b7 Suttons Bay, MI \u00b7 Consulting Chef \u00b7 Life partner of Jennifer, trained at Le Bernardin, co-opened Voyager and Bunny Bunny", "gender": "", "status": "active"}, {"id": "nana_w", "name": "Nana W.", "bio": "Nana Araba Wilmot \u00b7 Cherry Hill, NJ \u00b7 Private Chef \u00b7 Ghanaian heritage, trained at Le Coucou (helped secure Michelin star), 2023 Culinarian Award", "gender": "", "status": "active"}], "teams": [{"id": "alex", "name": "Team Alex", "owner": "Alex", "depthChart": {"captain": null, "coCaptain": null, "regulars": []}, "weeklyRosters": {}, "weeklyDepthCharts": {}}, {"id": "amber", "name": "Team Amber", "owner": "Amber", "depthChart": {"captain": null, "coCaptain": null, "regulars": []}, "weeklyRosters": {}, "weeklyDepthCharts": {}}, {"id": "lana", "name": "Team Lana", "owner": "Lana", "depthChart": {"captain": null, "coCaptain": null, "regulars": []}, "weeklyRosters": {}, "weeklyDepthCharts": {}}, {"id": "nick", "name": "Team Nick", "owner": "Nick", "depthChart": {"captain": null, "coCaptain": null, "regulars": []}, "weeklyRosters": {}, "weeklyDepthCharts": {}}, {"id": "nikki", "name": "Team Nikki", "owner": "Nikki", "depthChart": {"captain": null, "coCaptain": null, "regulars": []}, "weeklyRosters": {}, "weeklyDepthCharts": {}}, {"id": "scott", "name": "Team Scott", "owner": "Scott", "depthChart": {"captain": null, "coCaptain": null, "regulars": []}, "weeklyRosters": {}, "weeklyDepthCharts": {}}, {"id": "steve", "name": "Team Steve", "owner": "Steve", "depthChart": {"captain": null, "coCaptain": null, "regulars": []}, "weeklyRosters": {}, "weeklyDepthCharts": {}}, {"id": "zach", "name": "Team Zach", "owner": "Zach", "depthChart": {"captain": null, "coCaptain": null, "regulars": []}, "weeklyRosters": {}, "weeklyDepthCharts": {}}], "weeklyScores": {}, "currentWeek": 1, "createdAt": 1700000000000}];





// ─── Data Layer ───
const DEFAULT_SCORING_RULES = [
  // ─── Survivor (from your live league) ───
  { id: "loses_vote_due_to_risk", label: "Loses Vote Due to Risk", points: -2, category: "Strategy/Social" },
  { id: "volunteers_for_journey___risk", label: "Volunteers for Journey / Risk", points: 1, category: "Strategy/Social" },
  { id: "gains_advantage___idol", label: "Gains Advantage / Idol", points: 2, category: "Strategy/Social" },
  { id: "finds_hidden_immunity_idol", label: "Finds Hidden Immunity Idol", points: 3, category: "Strategy/Social" },
  { id: "successfully_splits_vote", label: "Successfully Splits Vote", points: 3, category: "Strategy/Social" },
  { id: "uses_extra_vote_successfully", label: "Uses Extra Vote Successfully", points: 3, category: "Strategy/Social" },
  { id: "steals_vote_successfully", label: "Steals Vote Successfully", points: 4, category: "Strategy/Social" },
  { id: "successfully_executes_blindside", label: "Successfully Executes Blindside", points: 5, category: "Strategy/Social" },
  { id: "1st_to_make_fire_for_their_tribe", label: "1st To Make Fire for Their Tribe", points: 5, category: "Strategy/Social" },
  { id: "wins_shot_in_the_dark", label: "Wins Shot in the Dark", points: 20, category: "Strategy/Social" },
  { id: "blamed_for_team_loss", label: "Blamed for Team Loss", points: -2, category: "Challenge Performance" },
  { id: "last_place_team_immunity", label: "Last Place Team Immunity", points: -1, category: "Challenge Performance" },
  { id: "last_place_team_reward", label: "Last Place Team Reward", points: -0.5, category: "Challenge Performance" },
  { id: "first_place_team_reward", label: "First Place Team Reward", points: 0.5, category: "Challenge Performance" },
  { id: "first_place_team_immunity", label: "First Place Team Immunity", points: 1, category: "Challenge Performance" },
  { id: "picked_to_go_with_winner_of_individual_reward", label: "Picked to Go with Reward Winner", points: 0.5, category: "Challenge Performance" },
  { id: "wins_individual_reward", label: "Wins Individual Reward", points: 2, category: "Challenge Performance" },
  { id: "wins_individual_immunity", label: "Wins Individual Immunity", points: 4, category: "Challenge Performance" },
  { id: "eliminated_with_idol_advantage", label: "Eliminated with Idol/Advantage", points: -15, category: "Tribal" },
  { id: "sv_eliminated", label: "Eliminated", points: -10, category: "Tribal" },
  { id: "plays_hidden_immunity_idol_incorrectly", label: "Plays Idol Incorrectly", points: -3, category: "Tribal" },
  { id: "receives_a_vote", label: "Receives a Vote", points: -1, category: "Tribal" },
  { id: "receives_zero_votes_at_tribal", label: "Receives Zero Votes at Tribal", points: 2, category: "Tribal" },
  { id: "correct_vote", label: "Correct Vote", points: 3, category: "Tribal" },
  { id: "saved_by_advantage", label: "Saved by Advantage", points: 3, category: "Tribal" },
  { id: "plays_hidden_immunity_idol_successfully", label: "Plays Idol Successfully", points: 6, category: "Tribal" },
  { id: "1st_member_of_the_jury", label: "1st Member of the Jury", points: 5, category: "Endgame" },
  { id: "wins_final_4_fire_making_challenge", label: "Wins Fire-Making Challenge", points: 5, category: "Endgame" },
  { id: "final_5", label: "Final 5", points: 10, category: "Endgame" },
  { id: "final_4", label: "Final 4", points: 15, category: "Endgame" },
  { id: "sv_winner", label: "Winner of the Show", points: 50, category: "Endgame" },

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

const SHOW_PRESETS = {
  survivor: { name: "Survivor", emoji: "S", color: "#d4a24e", defaultFormat: "captains",
    scoringDefaults: ["loses_vote_due_to_risk","volunteers_for_journey___risk","gains_advantage___idol","finds_hidden_immunity_idol","successfully_splits_vote","uses_extra_vote_successfully","steals_vote_successfully","successfully_executes_blindside","1st_to_make_fire_for_their_tribe","wins_shot_in_the_dark","blamed_for_team_loss","last_place_team_immunity","last_place_team_reward","first_place_team_reward","first_place_team_immunity","picked_to_go_with_winner_of_individual_reward","wins_individual_reward","wins_individual_immunity","eliminated_with_idol_advantage","sv_eliminated","plays_hidden_immunity_idol_incorrectly","receives_a_vote","receives_zero_votes_at_tribal","correct_vote","saved_by_advantage","plays_hidden_immunity_idol_successfully","1st_member_of_the_jury","wins_final_4_fire_making_challenge","final_5","final_4","sv_winner"] },
  top_chef: { name: "Top Chef", emoji: "TC", color: "#3dd6c8", defaultFormat: "captains",
    scoringDefaults: ["money_earned_per_1k","favorite_dish_in_quickfire","favorite_dish_in_elimination","win_quickfire","win_elimination","win_restaurant_wars","return_from_last_chance_kitchen","tc_final_3","tc_winner","least_favorite_dish_in_quickfire","least_favorite_dish_in_elimination","cuts_self","fails_to_get_all_components_on_plate","entirely_empty_plate","tc_eliminated"] },
  love_island: { name: "Love Island", emoji: "LI", color: "#ff5da0", defaultFormat: "standard",
    scoringDefaults: ["li_coupled","li_dumped","li_recoupled","li_got_text","li_date","li_casa_loyal","li_casa_switched","li_public_vote_saved","li_public_vote_bottom","li_challenge_win","li_final_couple","li_winner","li_crying"] },
  the_bachelor: { name: "The Bachelor/ette", emoji: "B", color: "#e86b8a", defaultFormat: "standard",
    scoringDefaults: ["ba_rose","ba_no_rose","ba_first_impression","ba_one_on_one","ba_group_date_rose","ba_two_on_one","ba_kiss","ba_self_elim","ba_crying","ba_limo_exit_drama","ba_hometown","ba_fantasy_suite","ba_final_rose","ba_engaged"] },
  bake_off: { name: "Great British Bake Off", emoji: "BO", color: "#ffd23d", defaultFormat: "standard",
    scoringDefaults: ["bo_star_baker","bo_technical_1st","bo_technical_top3","bo_technical_bottom3","bo_technical_last","bo_hollywood","bo_raw_soggy","bo_praised","bo_criticized","bo_eliminated","bo_final","bo_winner"] },
  custom: { name: "Custom Show", emoji: "TV", color: "#9d5dff", defaultFormat: "captains",
    scoringDefaults: ["eliminated","survived","won_episode","crying","winner_of_the_show"] },
  the_traitors: { name: "The Traitors", emoji: "T", color: "#e24b4a", defaultFormat: "captains",
    scoringDefaults: ["tr_murdered","tr_banished","tr_banished_traitor","tr_banished_faithful","tr_won_shield","tr_recruited","tr_survived_roundtable","tr_mission_money","tr_accused","tr_traitor_survived","tr_final","tr_winner"] },
  big_brother: { name: "Big Brother", emoji: "BB", color: "#4d8aff", defaultFormat: "captains",
    scoringDefaults: ["bb_won_hoh","bb_won_veto","bb_nominated","bb_used_veto_on_self","bb_veto_used_on_them","bb_backdoored","bb_survived_block","bb_evicted","bb_have_not","bb_won_luxury","bb_unanimous_vote","bb_final_2","bb_winner"] },
  the_challenge: { name: "The Challenge", emoji: "CH", color: "#ff8a3d", defaultFormat: "captains",
    scoringDefaults: ["ch_daily_win","ch_elim_win","ch_sent_in","ch_purged","ch_skull","ch_eliminated","ch_last_place_daily","ch_power_position","ch_called_out","ch_final","ch_winner"] },
  drag_race: { name: "RuPaul's Drag Race", emoji: "DR", color: "#9d5dff", defaultFormat: "captains",
    scoringDefaults: ["dr_won_maxi","dr_won_mini","dr_top2","dr_safe","dr_low","dr_bottom2","dr_shantay","dr_sashay","dr_runway_praised","dr_snatch_game_win","dr_final","dr_winner"] },
  amazing_race: { name: "The Amazing Race", emoji: "AR", color: "#3ddc84", defaultFormat: "captains",
    scoringDefaults: ["ar_leg_first","ar_leg_2nd","ar_leg_3rd","ar_leg_last","ar_eliminated","ar_non_elim","ar_detour_first","ar_roadblock_complete","ar_uturn","ar_speed_bump","ar_express_pass","ar_won_prize","ar_final","ar_winner"] },
  love_is_blind: { name: "Love is Blind", emoji: "LB", color: "#c084fc", defaultFormat: "captains",
    scoringDefaults: ["lb_pod_date","lb_engaged","lb_met_irl","lb_argument","lb_broke_up","lb_said_yes","lb_said_no","lb_still_together","lb_crying"] },
};

const FORMAT_INFO = {
  standard: {
    name: "Standard",
    desc: "Weekly snake redraft. Each manager picks contestants each week. Draft order is inverse of YTD standings. Season-long points race.",
    icon: "🔄",
  },
  captains: {
    name: "Heroes",
    desc: "One-time draft to build a roster. Hero (2× pts), Side-Kick (1.5× pts), and Vigilante slots. Weekly swap of 1 contestant + reorganize depth chart. Multiple managers can roster the same contestant.",
    icon: "🦸",
  },
  survivor_pool: {
    name: "Survivor Pool",
    desc: "Everyone picks one contestant before the season. If your pick is eliminated, you're out. Last person standing wins.",
    icon: "🎯",
  },
  predictions: {
    name: "Predictions",
    desc: "Commissioner creates questions each week. Players predict outcomes (pick one, yes/no, rank these). Points for correct answers.",
    icon: "🔮",
  },
  salary_cap: {
    name: "Salary Cap",
    desc: "Fixed budget to build your roster. Commissioner sets prices for each contestant. Spend wisely — premium picks cost more. Season-long roster.",
    icon: "💰",
  },
  elimination_pool: {
    name: "Elimination Pool",
    desc: "Each week, pick one contestant you think will survive. Can't reuse picks. Points for correct calls, penalties for wrong ones.",
    icon: "💀",
  },
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ─── Scoring Engine ───
function calcContestantWeekPoints(weekScores, contestantId) {
  const cs = weekScores?.[contestantId];
  if (!cs) return 0;
  return Object.values(cs).reduce((s, v) => s + v, 0);
}

function calcTeamWeekPoints(league, team, weekNum) {
  const weekScores = league.weeklyScores?.[weekNum] || {};
  const format = league.format;

  if (format === "standard") {
    const weekRoster = team.weeklyRosters?.[weekNum] || [];
    return weekRoster.reduce((sum, cid) => sum + calcContestantWeekPoints(weekScores, cid), 0);
  }

  if (format === "captains") {
    const savedChart = team.weeklyDepthCharts?.[weekNum];
    if (!savedChart) return 0;
    const chart = savedChart;

    // Best Ball: auto-optimize lineup from all rostered contestants
    if (league.bestBall) {
      const allRostered = [chart.captain, chart.coCaptain, ...(chart.regulars||[])].filter(Boolean);
      const scored = allRostered.map(cid => ({ cid, pts: calcContestantWeekPoints(weekScores, cid) })).sort((a,b) => b.pts - a.pts);
      let total = 0;
      if (scored[0]) total += scored[0].pts * 2;      // Best → Hero (2×)
      if (scored[1]) total += scored[1].pts * 1.5;    // 2nd → Side-Kick (1.5×)
      for (let i = 2; i < scored.length; i++) total += scored[i].pts; // Rest → Vigilante (1×)
      return Math.round(total * 10) / 10;
    }

    let total = 0;
    if (chart.captain) total += calcContestantWeekPoints(weekScores, chart.captain) * 2;
    if (chart.coCaptain) total += calcContestantWeekPoints(weekScores, chart.coCaptain) * 1.5;
    (chart.regulars || []).forEach(cid => { total += calcContestantWeekPoints(weekScores, cid); });
    return Math.round(total * 10) / 10;
  }

  if (format === "survivor_pool") {
    // Survivor pool: 1 point per week your pick is still alive
    const pick = team.survivorPoolPick;
    if (!pick) return 0;
    const contestant = (league.contestants||[]).find(c=>c.id===pick);
    if (!contestant || contestant.status === "eliminated") {
      // Check if they were eliminated this week or before
      if (contestant?.eliminatedWeek && contestant.eliminatedWeek <= Number(weekNum)) return 0;
    }
    return 1; // survived this week
  }

  if (format === "elimination_pool") {
    const weekPick = team.weeklyPicks?.[weekNum];
    if (!weekPick) return 0;
    const contestant = (league.contestants||[]).find(c=>c.id===weekPick);
    if (!contestant) return 0;
    // Did this contestant survive this week?
    if (contestant.status === "eliminated" && contestant.eliminatedWeek === Number(weekNum)) return -5;
    return 3; // survived
  }

  if (format === "salary_cap") {
    const roster = team.salaryCapRoster || [];
    return roster.reduce((sum, cid) => sum + calcContestantWeekPoints(weekScores, cid), 0);
  }

  if (format === "predictions") {
    // Predictions are stored per-team per-week with scores
    return team.predictionScores?.[weekNum] || 0;
  }

  return 0;
}

function calcStandings(league) {
  if (!league.teams?.length) return [];
  const weeks = Object.keys(league.weeklyScores || {}).sort((a, b) => +a - +b);

  if (league.format === "survivor_pool") {
    return league.teams.map(team => {
      const pick = team.survivorPoolPick;
      const contestant = pick ? (league.contestants||[]).find(c=>c.id===pick) : null;
      const isAlive = contestant && contestant.status !== "eliminated";
      const weeksAlive = contestant?.eliminatedWeek ? contestant.eliminatedWeek - 1 : weeks.length;
      return { ...team, total: weeksAlive, isAlive, pick: contestant?.name || "No pick", weeklyTotals: {} };
    }).sort((a,b) => {
      if (a.isAlive !== b.isAlive) return a.isAlive ? -1 : 1;
      return b.total - a.total;
    });
  }

  // Calculate base weekly points for all teams
  const teamsWithPoints = league.teams.map(team => {
    let total = 0;
    const weeklyTotals = {};
    weeks.forEach(w => {
      const wPts = calcTeamWeekPoints(league, team, w);
      weeklyTotals[w] = wPts;
      total += wPts;
    });
    return { ...team, total: Math.round(total * 10) / 10, weeklyTotals };
  });

  // Categories/Roto: rank teams by scoring category
  if (league.rotoScoring && (league.scoringRules||[]).length > 0) {
    const categories = [...new Set((league.scoringRules||[]).map(r=>r.category||"Other"))];
    const catTotals = {}; // {teamId: {category: total}}

    teamsWithPoints.forEach(team => {
      catTotals[team.id] = {};
      categories.forEach(cat => {
        const catRules = (league.scoringRules||[]).filter(r=>(r.category||"Other")===cat);
        let catTotal = 0;
        weeks.forEach(w => {
          const ws = league.weeklyScores?.[w] || {};
          // Sum all contestant scores for this team's rostered players in this category
          // Simplified: sum category rule points across all contestants on the team
          if (league.format === "captains") {
            const chart = team.weeklyDepthCharts?.[w] || team.depthChart || {};
            const rostered = [chart.captain, chart.coCaptain, ...(chart.regulars||[])].filter(Boolean);
            rostered.forEach(cid => {
              catRules.forEach(r => { catTotal += (ws[cid]?.[r.id] || 0); });
            });
          } else if (league.format === "standard") {
            const roster = team.weeklyRosters?.[w] || [];
            roster.forEach(cid => {
              catRules.forEach(r => { catTotal += (ws[cid]?.[r.id] || 0); });
            });
          }
        });
        catTotals[team.id][cat] = Math.round(catTotal * 10) / 10;
      });
    });

    // Rank each category (higher is better for positive, lower is better for negative)
    const catRanks = {}; // {teamId: {category: rank}}
    teamsWithPoints.forEach(t => { catRanks[t.id] = {}; });

    categories.forEach(cat => {
      const sorted = teamsWithPoints.map(t => ({ id: t.id, val: catTotals[t.id][cat] }))
        .sort((a,b) => b.val - a.val); // highest first = rank 1
      sorted.forEach((t, i) => { catRanks[t.id][cat] = i + 1; });
    });

    return teamsWithPoints.map(team => {
      const ranks = catRanks[team.id];
      const rotoTotal = Object.values(ranks).reduce((s,v) => s + v, 0);
      return {
        ...team,
        roto: true,
        catTotals: catTotals[team.id],
        catRanks: ranks,
        rotoTotal,
        total: rotoTotal,
      };
    }).sort((a, b) => a.rotoTotal - b.rotoTotal); // Lower roto total = better
  }

  // Head-to-Head: calculate W/L record from weekly matchups
  if (league.headToHead && league.teams.length >= 2) {
    const teamIds = league.teams.map(t=>t.id);
    const records = {};
    teamIds.forEach(id => { records[id] = { wins: 0, losses: 0, ties: 0 }; });

    weeks.forEach(w => {
      // Generate matchups: rotate schedule
      const wNum = Number(w);
      const ids = [...teamIds];
      // Simple round-robin rotation
      const rotated = [...ids];
      for (let r = 0; r < (wNum - 1) % Math.max(ids.length - 1, 1); r++) {
        const last = rotated.pop();
        rotated.splice(1, 0, last);
      }
      // Pair up
      const pairs = [];
      for (let i = 0; i < Math.floor(rotated.length / 2); i++) {
        pairs.push([rotated[i], rotated[rotated.length - 1 - i]]);
      }

      pairs.forEach(([a, b]) => {
        const aTeam = teamsWithPoints.find(t=>t.id===a);
        const bTeam = teamsWithPoints.find(t=>t.id===b);
        const aPts = aTeam?.weeklyTotals?.[w] || 0;
        const bPts = bTeam?.weeklyTotals?.[w] || 0;
        if (aPts > bPts) { records[a].wins++; records[b].losses++; }
        else if (bPts > aPts) { records[b].wins++; records[a].losses++; }
        else { records[a].ties++; records[b].ties++; }
      });
    });

    return teamsWithPoints.map(team => ({
      ...team,
      h2h: records[team.id],
      h2hRecord: records[team.id].wins + "-" + records[team.id].losses + (records[team.id].ties ? "-" + records[team.id].ties : ""),
      h2hWinPct: weeks.length > 0 ? Math.round((records[team.id].wins / Math.max(records[team.id].wins + records[team.id].losses + records[team.id].ties, 1)) * 1000) / 10 : 0,
    })).sort((a, b) => {
      // Sort by wins first, then total points as tiebreaker
      if (a.h2h.wins !== b.h2h.wins) return b.h2h.wins - a.h2h.wins;
      return b.total - a.total;
    });
  }

  return teamsWithPoints.sort((a, b) => b.total - a.total);
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

function EmptyState({ message }) {
  return (
    <div style={{ textAlign:"center",padding:"30px 20px",background:"#12121f",borderRadius:10,border:"1px dashed #2a2a4a" }}>
      <p style={{ color:"#6a6a8a",fontSize:13,margin:0 }}>{message}</p>
    </div>
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

function CreateLeagueScreen({ onSave, onCancel, commissionerUid }) {
  const [step, setStep] = useState(1);

  // Step 1: Basics
  const [name, setName] = useState("");
  const [showType, setShowType] = useState("survivor");
  const [showName, setShowName] = useState("");
  const [seasonName, setSeasonName] = useState("");
  const [format, setFormat] = useState("captains");

  // Step 2: Format config + scoring
  const [regularSlots, setRegularSlots] = useState(3);
  const [picksPerManager, setPicksPerManager] = useState(2);
  const [genderedDraft, setGenderedDraft] = useState(false);
  const [headToHead, setHeadToHead] = useState(false);
  const [bestBall, setBestBall] = useState(false);
  const [salaryBudget, setSalaryBudget] = useState(100);
  const [rotoScoring, setRotoScoring] = useState(false);
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
      setFormat(preset.defaultFormat);
      setScoringRules(DEFAULT_SCORING_RULES.filter(r => preset.scoringDefaults.includes(r.id)));
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

  function handleSave() {
    if (!name.trim()) return;
    const preset = SHOW_PRESETS[showType];
    onSave({
      id: generateId(),
      name: name.trim(),
      showType,
      showName: showType === "custom" ? showName.trim() : preset.name,
      seasonName: seasonName.trim() || "Season 1",
      format,
      captainsConfig: format === "captains" ? { regularSlots: Number(regularSlots) } : null,
      standardConfig: format === "standard" ? { picksPerManager: Number(picksPerManager), genderedDraft } : null,
      survivorPoolConfig: format === "survivor_pool" ? {} : null,
      salaryCapConfig: format === "salary_cap" ? { budget: Number(salaryBudget) } : null,
      eliminationPoolConfig: format === "elimination_pool" ? {} : null,
      predictionsConfig: format === "predictions" ? {} : null,
      headToHead,
      rotoScoring,
      bestBall: format === "captains" ? bestBall : false,
      scoringRules,
      contestants: [],
      teams,
      weeklyScores: {},
      currentWeek: 1,
      commissionerUid: commissionerUid || null,
      createdAt: Date.now(),
    });
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

  // Step indicator
  const steps = ["Basics", "Scoring", "Teams"];

  return (
    <div style={{ padding:20 }}>
      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
        <button onClick={step>1?()=>setStep(step-1):onCancel} style={{ background:"none",border:"none",color:"#8888aa",cursor:"pointer",padding:4 }}><Icon name="back" size={20}/></button>
        <h2 style={{ margin:0,fontSize:20,fontFamily:"'Anybody',sans-serif",fontWeight:800,color:"#e8e8f0",flex:1 }}>Create League</h2>
        <div style={{ fontSize:12,color:"#6a6a8a" }}>Step {step} of 3</div>
      </div>

      {/* Step indicator pills */}
      <div style={{ display:"flex",gap:6,marginBottom:24 }}>
        {steps.map((s,i) => (
          <div key={i} style={{ flex:1,height:4,borderRadius:2,background:i<step?"#e94560":"#1e1e38",transition:"all .3s" }}/>
        ))}
      </div>

      {/* ─── STEP 1: BASICS ─── */}
      {step === 1 && (
        <div>
          <Input label="League Name" placeholder="e.g. Top Chef Fantasy 2026" value={name} onChange={e=>setName(e.target.value)} />

          <Select label="Show" value={showType} onChange={e=>setShowType(e.target.value)} options={[
            { value:"survivor",label:"Survivor" },{ value:"top_chef",label:"Top Chef" },
            { value:"love_island",label:"Love Island" },{ value:"the_bachelor",label:"The Bachelor/ette" },
            { value:"bake_off",label:"Great British Bake Off" },
            { value:"the_traitors",label:"The Traitors" },{ value:"big_brother",label:"Big Brother" },
            { value:"the_challenge",label:"The Challenge" },{ value:"drag_race",label:"RuPaul's Drag Race" },
            { value:"amazing_race",label:"The Amazing Race" },{ value:"love_is_blind",label:"Love is Blind" },{ value:"custom",label:"Custom Show" },
          ]} />
          {showType === "custom" && <Input label="Show Name" placeholder="e.g. The Traitors" value={showName} onChange={e=>setShowName(e.target.value)} />}
          <Input label="Season Name" placeholder="e.g. Season 22" value={seasonName} onChange={e=>setSeasonName(e.target.value)} />

          <label style={{ display:"block",fontSize:12,color:"#8888aa",marginBottom:8,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em" }}>League Format</label>
          <div style={{ display:"flex",gap:8,marginBottom:8,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch" }}>
            {["standard","captains","survivor_pool","elimination_pool","predictions","salary_cap"].map(f => (
              <button key={f} onClick={() => setFormat(f)} style={{
                padding:"8px 16px",borderRadius:99,cursor:"pointer",whiteSpace:"nowrap",
                background: format===f ? "#e9456022" : "transparent",
                border: format===f ? "1px solid #e9456066" : "1px solid #2a2a4a",
                color: format===f ? "#e94560" : "#7a7a9a",
                fontSize:13,fontWeight:format===f?700:500,fontFamily:"'Outfit',sans-serif",
                transition:"all 0.15s ease",flexShrink:0,
              }}>
                {FORMAT_INFO[f]?.name||f}
              </button>
            ))}
          </div>
          <div style={{ padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",marginBottom:16 }}>
            <div style={{ color:"#e8e8f0",fontSize:13,lineHeight:1.6 }}>{FORMAT_INFO[format]?.desc}</div>
          </div>

          {/* Format-specific config */}
          {format === "captains" && (
            <div style={{ padding:"14px 16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",marginBottom:16 }}>
              <div style={{ fontSize:12,fontWeight:600,color:"#f5a623",marginBottom:10 }}>HEROES CONFIG</div>
              <Input label="Number of Vigilante Spots" type="number" min="1" max="10" value={regularSlots} onChange={e=>setRegularSlots(e.target.value)} />
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

          {/* Settings toggles */}
          <label style={{ display:"block",fontSize:12,color:"#8888aa",marginBottom:8,marginTop:8,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em" }}>League Settings</label>
          <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:16 }}>
            {(format === "standard" || format === "captains") && (
              <label style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",cursor:"pointer" }}>
                <input type="checkbox" checked={headToHead} onChange={e=>setHeadToHead(e.target.checked)} style={{ accentColor:"#e94560",width:18,height:18 }} />
                <div>
                  <div style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>Head-to-Head Matchups</div>
                  <div style={{ color:"#6a6a8a",fontSize:11,marginTop:2 }}>Weekly paired matchups. W/L record determines standings instead of total points.</div>
                </div>
              </label>
            )}
            {format === "captains" && (
              <label style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",cursor:"pointer" }}>
                <input type="checkbox" checked={bestBall} onChange={e=>setBestBall(e.target.checked)} style={{ accentColor:"#e94560",width:18,height:18 }} />
                <div>
                  <div style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>Best Ball</div>
                  <div style={{ color:"#6a6a8a",fontSize:11,marginTop:2 }}>Auto-optimizes your lineup each week. No roster management needed — just draft well.</div>
                </div>
              </label>
            )}
            {(format === "standard" || format === "captains") && (
              <label style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",cursor:"pointer" }}>
                <input type="checkbox" checked={rotoScoring} onChange={e=>setRotoScoring(e.target.checked)} style={{ accentColor:"#e94560",width:18,height:18 }} />
                <div>
                  <div style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>Categories / Roto</div>
                  <div style={{ color:"#6a6a8a",fontSize:11,marginTop:2 }}>Rank teams by scoring category (most challenge wins, fewest penalties, etc). Best cumulative rank wins.</div>
                </div>
              </label>
            )}
          </div>

          <Btn onClick={()=>setStep(2)} disabled={!name.trim()} style={{ width:"100%",justifyContent:"center" }}>Next: Scoring Rules</Btn>
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
            <Btn variant="ghost" onClick={()=>setStep(1)} style={{ flex:1,justifyContent:"center" }}>Back</Btn>
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
              <div>{FORMAT_INFO[format]?.name} format · {scoringRules.length} scoring rules · {teams.length} team{teams.length!==1?"s":""}</div>
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
function LeagueDashboard({ league, onUpdate, onBack, onReset, loggedInTeamId, isCommissioner, skipLogin, allLeagues }) {
  const [tab, setTab] = useState("standings");
  const [modal, setModal] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const standings = useMemo(() => calcStandings(league), [league]);

  const allTabs = [
    { id:"standings",label:"Standings",icon:"trophy",access:"all" },
    { id:"contestants",label:"Cast",icon:"star",access:"all" },
    { id:"teams",label:"Teams",icon:"users",access:"all" },
    { id:"scoring",label:"Scoring",icon:"chart",access:"commissioner" },
    ...(league.format === "standard" ? [{ id:"weekly-draft",label:"Draft",icon:"grid",access:"commissioner" }] : []),
    ...(league.format === "captains" ? [{ id:"depth-chart",label:"My Roster",icon:"crown",access:"all" }] : []),
    ...(league.format === "survivor_pool" ? [{ id:"my-pick",label:"My Pick",icon:"star",access:"all" }] : []),
    ...(league.format === "elimination_pool" ? [{ id:"weekly-pick",label:"Weekly Pick",icon:"star",access:"all" }] : []),
    ...(league.format === "salary_cap" ? [
      { id:"my-roster-cap",label:"My Roster",icon:"crown",access:"all" },
      { id:"set-prices",label:"Prices",icon:"settings",access:"commissioner" },
    ] : []),
    ...(league.format === "predictions" ? [
      { id:"predict",label:"Predict",icon:"star",access:"all" },
      { id:"manage-questions",label:"Questions",icon:"settings",access:"commissioner" },
    ] : []),
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
              <span>{FORMAT_INFO[league.format]?.name}</span>
              <span style={{ width:3,height:3,borderRadius:"50%",background:"#3a3a5a" }}></span>
              <span>Week {league.currentWeek}</span>
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
        {tab === "standings" && <StandingsTab league={league} standings={standings} />}
        {tab === "contestants" && <ContestantsTab league={league} onUpdate={isCommissioner?onUpdate:null} setModal={isCommissioner?setModal:()=>{}} setEditing={isCommissioner?setEditingItem:()=>{}} readOnly={!isCommissioner} />}
        {tab === "teams" && <TeamsTab league={league} onUpdate={isCommissioner?onUpdate:null} setModal={isCommissioner?setModal:()=>{}} setEditing={isCommissioner?setEditingItem:()=>{}} readOnly={!isCommissioner} />}
        {tab === "scoring" && isCommissioner && <ScoringTab league={league} onUpdate={onUpdate} />}
        {tab === "weekly-draft" && isCommissioner && <WeeklyDraftTab league={league} onUpdate={onUpdate} standings={standings} />}
        {tab === "depth-chart" && <DepthChartTab league={league} onUpdate={onUpdate} lockedToTeamId={isCommissioner ? null : loggedInTeamId} defaultTeamId={loggedInTeamId} isCommissioner={isCommissioner} />}
        {tab === "my-pick" && <SurvivorPoolTab league={league} onUpdate={onUpdate} loggedInTeamId={loggedInTeamId} isCommissioner={isCommissioner} />}
        {tab === "weekly-pick" && <EliminationPoolTab league={league} onUpdate={onUpdate} loggedInTeamId={loggedInTeamId} isCommissioner={isCommissioner} />}
        {tab === "my-roster-cap" && <SalaryCapRosterTab league={league} onUpdate={onUpdate} loggedInTeamId={loggedInTeamId} isCommissioner={isCommissioner} />}
        {tab === "set-prices" && isCommissioner && <SalaryCapPricesTab league={league} onUpdate={onUpdate} />}
        {tab === "predict" && <PredictionsPlayerTab league={league} onUpdate={onUpdate} loggedInTeamId={loggedInTeamId} />}
        {tab === "manage-questions" && isCommissioner && <PredictionsCommishTab league={league} onUpdate={onUpdate} />}
        {tab === "settings" && isCommissioner && <SettingsTab league={league} onUpdate={onUpdate} onReset={onReset} allLeagues={allLeagues} />}
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
function StandingsTab({ league, standings }) {
  const [expandedTeam, setExpandedTeam] = useState(null);
  const weeks = Object.keys(league.weeklyScores || {}).sort((a,b)=>+a - +b);
  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
        <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>Leaderboard</h3>
        <Badge color="#f5a623">Week {league.currentWeek}</Badge>
      </div>
      {standings.length === 0 ? <EmptyState message="Add teams and score weeks to see standings." /> : (
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {standings.map((team,i) => {
            const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":null;
            const lastWk = weeks[weeks.length-1];
            const wkPts = lastWk ? (team.weeklyTotals?.[lastWk]||0) : 0;
            return (
              <div key={team.id} onClick={()=>setExpandedTeam(expandedTeam===team.id?null:team.id)} style={{
                cursor:"pointer",overflow:"hidden",borderRadius:12,
                background:i===0?"linear-gradient(135deg,rgba(255,77,106,0.1),rgba(255,210,61,0.05))":i===1?"linear-gradient(135deg,rgba(200,200,220,0.06),transparent)":i===2?"linear-gradient(135deg,rgba(205,127,50,0.06),transparent)":"#12121f",
                border:i===0?"1px solid rgba(255,77,106,0.25)":i<3?"1px solid rgba(200,200,220,0.1)":"1px solid #1e1e38",
                transition:"all 0.2s",
              }}>
                <div style={{ display:"flex",alignItems:"center",gap:12,padding:"16px" }}>
                <div style={{ width:36,height:36,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",
                  background:i===0?"rgba(255,77,106,0.15)":i===1?"rgba(200,200,220,0.1)":i===2?"rgba(205,127,50,0.1)":"#1a1a2e",
                  fontSize:medal?18:14,fontWeight:800,color:i===0?"#ff4d6a":i===1?"#c0c0d0":i===2?"#cd7f32":"#6a6a8a",
                  fontFamily:"'Anybody',sans-serif",
                }}>{medal||(i+1)}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ color:"#e8e8f0",fontWeight:700,fontSize:14 }}>{team.name}</div>
                  <div style={{ color:"#6a6a8a",fontSize:11,marginTop:2 }}>{team.owner}{team.h2hRecord ? ` · ${team.h2hRecord}` : ""}{wkPts !== 0 ? ` · ${wkPts>0?"+":""}${wkPts} this wk` : ""}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  {team.h2hRecord ? (
                    <>
                      <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:20,fontWeight:900,color:"#e8e8f0",letterSpacing:"-0.02em" }}>{team.h2hRecord}</div>
                      <div style={{ fontSize:10,color:"#4a4a6a" }}>{team.total} pts</div>
                    </>
                  ) : team.roto ? (
                    <>
                      <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:20,fontWeight:900,color:"#9d5dff",letterSpacing:"-0.02em" }}>{team.rotoTotal}</div>
                      <div style={{ fontSize:10,color:"#4a4a6a" }}>roto pts</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:24,fontWeight:900,color:team.total>0?"#e8e8f0":team.total<0?"#e94560":"#6a6a8a",letterSpacing:"-0.02em" }}>{team.total}</div>
                      <div style={{ fontSize:10,color:"#4a4a6a" }}>pts</div>
                    </>
                  )}
                </div>
                </div>
              {expandedTeam===team.id && team.roto && team.catRanks && (
                <div style={{ padding:"10px 16px 14px",borderTop:"1px solid #1e1e38" }}>
                  <div style={{ fontSize:10,color:"#6a6a8a",fontWeight:600,textTransform:"uppercase",marginBottom:6 }}>Category Rankings</div>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                    {Object.entries(team.catRanks).map(([cat, rank]) => (
                      <span key={cat} style={{ padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,
                        background:rank<=2?"#9d5dff18":"#1e1e38",
                        color:rank<=2?"#9d5dff":"#c8c8da",
                        border:rank<=2?"1px solid #9d5dff33":"1px solid transparent" }}>
                        #{rank} {cat} ({team.catTotals[cat]})
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {expandedTeam===team.id && (()=>{
                const chart = team.weeklyDepthCharts?.[String(league.currentWeek)] || team.depthChart || {};
                const getC = (id) => (league.contestants||[]).find(c=>c.id===id);
                const captain = getC(chart.captain);
                const coCaptain = getC(chart.coCaptain);
                const regulars = (chart.regulars||[]).map(id=>getC(id)).filter(Boolean);
                return (
                  <div style={{ padding:"0 16px 14px",borderTop:"1px solid #1e1e38" }}>
                    <div style={{ fontSize:10,color:"#6a6a8a",fontWeight:600,textTransform:"uppercase",marginTop:10,marginBottom:6 }}>Current Roster</div>
                    <div style={{ display:"flex",flexWrap:"wrap",gap:6 }}>
                      {captain && <span style={{ padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,background:"#f5a62318",color:"#f5a623",border:"1px solid #f5a62333" }}>H · {captain.name}</span>}
                      {coCaptain && <span style={{ padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:600,background:"#4ecdc418",color:"#4ecdc4",border:"1px solid #4ecdc433" }}>SK · {coCaptain.name}</span>}
                      {regulars.map(c => <span key={c.id} style={{ padding:"4px 10px",borderRadius:6,fontSize:11,fontWeight:500,background:"#1e1e38",color:"#c8c8da" }}>{c.name}</span>)}
                      {!captain && !coCaptain && regulars.length===0 && <span style={{ fontSize:11,color:"#6a6a8a" }}>No roster set</span>}
                    </div>
                  </div>
                );
              })()}
              </div>
            );
          })}
        </div>
      )}
      {weeks.length > 0 && standings.length > 0 && (
        <div style={{ marginTop:24 }}>
          <h4 style={{ fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:15,color:"#e8e8f0",marginBottom:12 }}>Weekly Breakdown</h4>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%",borderCollapse:"collapse",fontSize:12 }}>
              <thead><tr>
                <th style={{ textAlign:"left",padding:"8px 10px",color:"#6a6a8a",fontWeight:600,borderBottom:"1px solid #1e1e38" }}>Team</th>
                {weeks.map(w=><th key={w} style={{ textAlign:"center",padding:"8px 10px",color:"#6a6a8a",fontWeight:600,borderBottom:"1px solid #1e1e38" }}>Wk {w}</th>)}
                <th style={{ textAlign:"right",padding:"8px 10px",color:"#6a6a8a",fontWeight:600,borderBottom:"1px solid #1e1e38" }}>Total</th>
              </tr></thead>
              <tbody>
                {standings.map(team=>(
                  <tr key={team.id}>
                    <td style={{ padding:"8px 10px",color:"#e8e8f0",fontWeight:600 }}>{team.name}</td>
                    {weeks.map(w=><td key={w} style={{ textAlign:"center",padding:"8px 10px",color:(team.weeklyTotals?.[w]||0)>0?"#4ecdc4":(team.weeklyTotals?.[w]||0)<0?"#e94560":"#6a6a8a" }}>{team.weeklyTotals?.[w]||0}</td>)}
                    <td style={{ textAlign:"right",padding:"8px 10px",color:"#e8e8f0",fontWeight:700 }}>{team.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONTESTANTS TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ContestantsTab({ league, onUpdate, setModal, setEditing, readOnly }) {
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState(null);
  const [sortBy, setSortBy] = useState("total");
  const [tribeMode, setTribeMode] = useState(false);
  const [selectedForMove, setSelectedForMove] = useState(new Set());
  const [bulkAddOpen, setBulkAddOpen] = useState(false);

  const weeks = Object.keys(league.weeklyScores || {}).sort((a,b)=>+a - +b);
  const tribes = league.tribes || {};
  const tribeNames = Object.keys(tribes);
  const isMerged = league.merged || false;

  const contestantStats = useMemo(() => {
    return (league.contestants||[]).map(c => {
      const weeklyTotals = {};
      let total = 0;
      weeks.forEach(w => {
        const pts = calcContestantWeekPoints(league.weeklyScores?.[w] || {}, c.id);
        weeklyTotals[w] = Math.round(pts * 10) / 10;
        total += pts;
      });
      const prevWeek = String((league.currentWeek||1) - 1);
      const lastWeekPts = prevWeek !== "0" ? (weeklyTotals[prevWeek] || 0) : 0;
      let bestWeekPts = -Infinity, worstWeekPts = Infinity, bestWeekNum = null, worstWeekNum = null;
      weeks.forEach(w => { const p = weeklyTotals[w]||0; if(p>bestWeekPts){bestWeekPts=p;bestWeekNum=w;} if(p<worstWeekPts){worstWeekPts=p;worstWeekNum=w;} });
      if (bestWeekPts === -Infinity) bestWeekPts = 0;
      if (worstWeekPts === Infinity) worstWeekPts = 0;
      return { ...c, total: Math.round(total * 10) / 10, weeklyTotals, lastWeekPts: Math.round(lastWeekPts*10)/10, bestWeekPts: Math.round(bestWeekPts*10)/10, worstWeekPts: Math.round(worstWeekPts*10)/10, bestWeekNum, worstWeekNum };
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
    return a.name.localeCompare(b.name);
  });

  function getWeekDetail(cid, weekNum) {
    const ws = league.weeklyScores?.[weekNum] || {};
    const cs = ws[cid] || {};
    return (league.scoringRules||[]).filter(r => cs[r.id] && cs[r.id] !== 0).map(r => {
      const pts = cs[r.id];
      const count = r.points !== 0 ? Math.round(pts / r.points) : 0;
      return { rule: r, count, pts: Math.round(pts * 10) / 10 };
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

  // ─── TRIBE MODE ───
  if (tribeMode && !readOnly && onUpdate) {
    const ac = (league.contestants||[]).filter(c=>c.status!=="eliminated");
    const unassigned = ac.filter(c=>!tribeNames.some(t=>(tribes[t]||[]).includes(c.id)));
    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
          <h3 style={{margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em"}}>Manage Tribes</h3>
          <Btn small variant="ghost" onClick={()=>{setTribeMode(false);setSelectedForMove(new Set())}}>← Back to Cast</Btn>
        </div>
        <div style={{padding:"12px 16px",borderRadius:10,marginBottom:16,background:isMerged?"#f5a62311":"#12121f",border:isMerged?"1px solid #f5a62333":"1px solid #1e1e38",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:"#e8e8f0",fontWeight:700,fontSize:14}}>{isMerged?`\ud83c\udff4 Merged: ${league.mergedTribeName||"Merged"}`:"Tribes Active"}</div>
            <div style={{color:"#6a6a8a",fontSize:11,marginTop:2}}>{isMerged?"All contestants one group. Original tribes kept for reference.":"Contestants grouped by tribe."}</div>
          </div>
          <Btn small variant={isMerged?"danger":"success"} onClick={toggleMerge}>{isMerged?"Unmerge":"Merge Tribes"}</Btn>
        </div>
        {selectedForMove.size>0&&(<div style={{padding:"10px 14px",borderRadius:8,marginBottom:14,background:"#e9456011",border:"1px solid #e9456033"}}>
          <div style={{fontSize:12,fontWeight:600,color:"#e94560",marginBottom:8}}>{selectedForMove.size} selected \u2014 move to:</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{tribeNames.map(t=><Btn key={t} small variant="secondary" onClick={()=>moveSelectedToTribe(t)}>{t}</Btn>)}<Btn small variant="ghost" onClick={()=>setSelectedForMove(new Set())}>Cancel</Btn></div>
        </div>)}
        {tribeNames.map(tribe=>{
          const mids=(tribes[tribe]||[]).filter(id=>ac.some(c=>c.id===id));
          const tribeCol = (league.tribeColors||{})[tribe] || "#888";
          const members=mids.map(id=>ac.find(c=>c.id===id)).filter(Boolean);
          return (<div key={tribe} style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <input type="color" value={tribeCol} onChange={e=>onUpdate({...league,tribeColors:{...(league.tribeColors||{}),[tribe]:e.target.value}})}
                  style={{width:20,height:20,border:"none",borderRadius:4,cursor:"pointer",padding:0,background:"transparent"}} title="Change tribe color" />
                <div style={{fontSize:13,fontWeight:700,color:tribeCol}}>{tribe}</div>
                <span style={{fontSize:11,color:"#6a6a8a"}}>({members.length})</span>
                <button onClick={()=>selectTribe(tribe)} style={{background:"none",border:"1px solid #2a2a4a",borderRadius:4,padding:"2px 8px",fontSize:10,color:"#8888aa",cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Select All</button>
              </div>
              <button onClick={()=>removeTribe(tribe)} style={{background:"none",border:"none",color:"#4a4a6a",cursor:"pointer",padding:2}}><Icon name="trash" size={12}/></button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:3}}>
              {members.map(c=>{const sel=selectedForMove.has(c.id);return(
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,background:sel?"#e9456018":"#12121f",border:sel?"1px solid #e9456033":"1px solid #1e1e38"}}>
                  <button onClick={()=>toggleSelect(c.id)} style={{width:22,height:22,borderRadius:4,border:sel?"none":"2px solid #3a3a5a",cursor:"pointer",background:sel?"#e94560":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{sel&&<Icon name="check" size={12}/>}</button>
                  <span style={{flex:1,color:"#e8e8f0",fontSize:13,fontWeight:500}}>{c.name}</span>
                  <select value={c.tribe||""} onChange={e=>reassignSingle(c.id,e.target.value)} style={{padding:"3px 8px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:4,color:"#8888aa",fontSize:11,fontFamily:"'Outfit',sans-serif"}}>
                    {tribeNames.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              )})}
              {members.length===0&&<div style={{color:"#4a4a6a",fontSize:11,fontStyle:"italic",padding:"6px 12px"}}>No active members</div>}
            </div>
          </div>);
        })}
        {unassigned.length>0&&(<div style={{marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:"#f5a623",marginBottom:6}}>Unassigned ({unassigned.length})</div>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            {unassigned.map(c=>{const sel=selectedForMove.has(c.id);return(
              <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,background:sel?"#e9456018":"#12121f",border:sel?"1px solid #e9456033":"1px solid #1e1e38"}}>
                <button onClick={()=>toggleSelect(c.id)} style={{width:22,height:22,borderRadius:4,border:sel?"none":"2px solid #3a3a5a",cursor:"pointer",background:sel?"#e94560":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{sel&&<Icon name="check" size={12}/>}</button>
                <span style={{flex:1,color:"#e8e8f0",fontSize:13}}>{c.name}</span>
              </div>
            )})}
          </div>
        </div>)}
        <Btn small variant="ghost" onClick={addNewTribe} style={{marginTop:8}}><Icon name="plus" size={12}/> Add New Tribe</Btn>
      </div>
    );
  }

  // ─── NORMAL VIEW ───
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <h3 style={{margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em"}}>Cast Scoring</h3>
        <div style={{display:"flex",gap:6}}>
          {!readOnly&&onUpdate&&<Btn small variant="ghost" onClick={()=>setTribeMode(true)}>Tribes</Btn>}
          {!readOnly&&<Btn small variant="ghost" onClick={()=>setBulkAddOpen(true)}>Bulk Add</Btn>}
          {!readOnly&&<Btn small onClick={()=>{setEditing(null);setModal("add-contestant")}}><Icon name="plus" size={14}/> Add</Btn>}
        </div>
      </div>
      {isMerged&&(<div style={{padding:"8px 12px",background:"#f5a62311",borderRadius:8,border:"1px solid #f5a62333",marginBottom:12,fontSize:12,color:"#f5a623",display:"flex",alignItems:"center",gap:6}}>
        \ud83c\udff4 Merged into {league.mergedTribeName||"one tribe"} \u2014 individual game
      </div>)}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:6}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {["all","active","eliminated"].map(f=>(<button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 14px",borderRadius:99,border:filter===f?"1px solid #e9456044":"1px solid #1e1e38",cursor:"pointer",fontSize:12,fontWeight:600,textTransform:"capitalize",background:filter===f?"#e9456018":"transparent",color:filter===f?"#e94560":"#7a7a9a",fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>{f}{f==="all"?` (${league.contestants?.length||0})`:""}</button>))}
        </div>
        <div style={{display:"flex",gap:4}}>
          {[{id:"total",label:"Season"},{id:"lastWeek",label:"Last Wk"},{id:"best",label:"Best"},{id:"worst",label:"Worst"},{id:"name",label:"A-Z"}].map(s=>(<button key={s.id} onClick={()=>setSortBy(s.id)} style={{padding:"5px 10px",borderRadius:99,border:sortBy===s.id?"1px solid #e9456044":"1px solid transparent",cursor:"pointer",fontSize:11,fontWeight:600,background:sortBy===s.id?"#e9456018":"transparent",color:sortBy===s.id?"#e94560":"#6a6a8a",fontFamily:"'Outfit',sans-serif",transition:"all .15s"}}>{s.label}</button>))}
        </div>
      </div>
      {filtered.length===0?<EmptyState message="No contestants found."/>:(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {filtered.map((c,rank)=>{
            const isExp=expandedId===c.id;
            // Determine display values based on sort
            let bigVal, bigLabel, subtitle;
            if(sortBy==="total"){bigVal=c.total;bigLabel=null;subtitle=c.lastWeekPts!==0?`Last wk: ${c.lastWeekPts>0?"+":""}${c.lastWeekPts}`:null;}
            else if(sortBy==="lastWeek"){bigVal=c.lastWeekPts;bigLabel=`wk ${(league.currentWeek||1)-1}`;subtitle=`Season: ${c.total}`;}
            else if(sortBy==="best"){bigVal=c.bestWeekPts;bigLabel=c.bestWeekNum?`wk ${c.bestWeekNum}`:null;subtitle=`Season: ${c.total}`;}
            else if(sortBy==="worst"){bigVal=c.worstWeekPts;bigLabel=c.worstWeekNum?`wk ${c.worstWeekNum}`:null;subtitle=`Season: ${c.total}`;}
            else{bigVal=c.total;bigLabel=null;subtitle=null;}
            return(<div key={c.id} style={{borderRadius:12,background:"#12121f",border:"1px solid #1e1e38",opacity:c.status==="eliminated"?0.5:1,overflow:"hidden",transition:"all 0.2s"}}>
              <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer"}} onClick={()=>setExpandedId(isExp?null:c.id)}>
                <div style={{width:28,textAlign:"center",fontSize:13,fontWeight:700,color:"#6a6a8a"}}>{sortBy!=="name"?(rank+1):""}</div>
                <div style={{width:36,height:36,borderRadius:10,flexShrink:0,background:c.status==="eliminated"?"#2a2a4a":getTribeColor(league,c),display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff"}}>{c.name?.[0]?.toUpperCase()||"?"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:"#e8e8f0",fontWeight:600,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                    {c.name}
                    {!isMerged&&c.tribe&&<span style={{color:"#4a4a6a",fontSize:10,marginLeft:6}}>{c.tribe}</span>}
                    {c.status==="eliminated"&&<span style={{marginLeft:6,fontSize:10,color:"#e94560"}}>ELIM{c.eliminatedWeek?` Wk ${c.eliminatedWeek}`:""}</span>}
                  </div>
                  {subtitle&&<div style={{fontSize:11,color:"#6a6a8a",marginTop:1}}>{subtitle}</div>}
                </div>
                <div style={{textAlign:"right",minWidth:44}}>
                  <div style={{fontFamily:"'Anybody',sans-serif",fontSize:18,fontWeight:800,color:bigVal>0?"#4ecdc4":bigVal<0?"#e94560":"#6a6a8a"}}>{bigVal>0?"+":""}{bigVal}</div>
                  {bigLabel&&<div style={{fontSize:9,color:"#4a4a6a"}}>{bigLabel}</div>}
                </div>
                <div style={{transform:isExp?"rotate(90deg)":"none",transition:"transform 0.15s ease",color:"#4a4a6a"}}><Icon name="chevron" size={14}/></div>
              </div>
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
                        {label:"Last Wk",val:lastWkPts,sub:`Wk ${weeks[weeks.length-1]}`,color:lastWkPts>0?"#4ecdc4":lastWkPts<0?"#e94560":"#6a6a8a"},
                        {label:"Best",val:Math.round(best.pts*10)/10,sub:best.wk?`Wk ${best.wk}`:"—",color:"#f5a623"},
                        {label:"Worst",val:Math.round(worst.pts*10)/10,sub:worst.wk?`Wk ${worst.wk}`:"—",color:"#e94560"},
                        {label:"Season",val:c.total,sub:`${weeks.length} wks`,color:c.total>0?"#4ecdc4":"#6a6a8a"},
                      ].map(s=>(
                        <div key={s.label} style={{flex:1,padding:"8px 6px",textAlign:"center",background:"#0d0d18",borderRight:"1px solid #1e1e38"}}>
                          <div style={{fontSize:9,color:"#6a6a8a",textTransform:"uppercase",fontWeight:600,marginBottom:2}}>{s.label}</div>
                          <div style={{fontSize:16,fontWeight:800,fontFamily:"'Anybody',sans-serif",color:s.color}}>{s.val>0?"+":""}{s.val}</div>
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
                      <div style={{width:50,fontSize:10,fontWeight:600,color:"#6a6a8a"}}>Week</div>
                      <div style={{flex:1,fontSize:10,fontWeight:600,color:"#6a6a8a"}}>Events</div>
                      <div style={{width:50,textAlign:"right",fontSize:10,fontWeight:600,color:"#6a6a8a"}}>Pts</div>
                    </div>
                    {weeks.map(w=>{
                      const wP=c.weeklyTotals[w]||0;const dets=getWeekDetail(c.id,w);
                      if(wP===0&&dets.length===0)return null;
                      return(<div key={w} style={{display:"flex",alignItems:"flex-start",padding:"8px 10px",borderBottom:"1px solid #1a1a30"}}>
                        <div style={{width:50,fontSize:12,fontWeight:600,color:"#8888aa"}}>Wk {w}</div>
                        <div style={{flex:1,display:"flex",flexWrap:"wrap",gap:3}}>
                          {dets.map(d=>(<span key={d.rule.id} style={{fontSize:9,padding:"2px 5px",borderRadius:3,background:d.rule.points>=0?"#4ecdc418":"#e9456018",color:d.rule.points>=0?"#4ecdc4":"#e94560",whiteSpace:"nowrap"}}>{d.rule.label}{d.count>1?` ×${d.count}`:""}</span>))}
                        </div>
                        <div style={{width:50,textAlign:"right",fontWeight:700,fontSize:13,fontFamily:"'Anybody',sans-serif",color:wP>0?"#4ecdc4":wP<0?"#e94560":"#6a6a8a"}}>{wP>0?"+":""}{wP}</div>
                      </div>);
                    })}
                  </div>
                </div>):(<div style={{color:"#4a4a6a",fontSize:12,marginTop:8}}>No scores yet.</div>)}
                {!readOnly&&(<div style={{marginTop:10}}><Btn small variant="ghost" onClick={()=>{setEditing(c);setModal("add-contestant")}}><Icon name="edit" size={12}/> Edit</Btn></div>)}
              </div>)}
            </div>);
          })}
        </div>
      )}
      {bulkAddOpen && <BulkAddContestants league={league} onUpdate={onUpdate} onClose={()=>setBulkAddOpen(false)} />}
    </div>
  );
}

function BulkAddContestants({ league, onUpdate, onClose }) {
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState(null);

  function parseText() {
    const text = rawText.trim();
    if (!text) return;

    const contestants = [];

    // Try Bravo-style format: look for name headers followed by bio paragraphs
    // Pattern: lines that look like full names (2-4 words, title case, short) followed by longer text
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

    // Strategy 1: Look for "Hometown:" pattern (Bravo format)
    const hasBravoFormat = lines.some(l => l.startsWith("Hometown:"));

    if (hasBravoFormat) {
      let currentName = null;
      let currentBio = [];
      let hometown = "";
      let city = "";
      let occupation = "";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip photo credits, "Photo: Bravo", section headers
        if (line.startsWith("Photo:") || line.startsWith("RELATED:") || line.startsWith("How to Watch")) continue;

        if (line.startsWith("Hometown:")) {
          hometown = line.replace("Hometown:", "").trim();
        } else if (line.startsWith("Current City of Residence:") || line.startsWith("Current city of residence:") || line.startsWith("Current Residence:")) {
          city = line.replace(/Current.*?:/i, "").trim();
        } else if (line.startsWith("Occupation/Profession:") || line.startsWith("Occupation:")) {
          occupation = line.replace(/Occupation.*?:/i, "").trim();
          // We have enough to save this contestant
          if (currentName) {
            const bio = [city || hometown, occupation].filter(Boolean).join(" · ");
            contestants.push({ name: currentName, bio });
          }
          currentName = null;
          hometown = ""; city = ""; occupation = "";
        } else if (
          // Detect a name line: relatively short, title case, no common bio words
          line.length < 60 &&
          line.length > 3 &&
          !line.startsWith("Born") &&
          !line.startsWith("After") &&
          !line.startsWith("A ") &&
          !line.startsWith("Every") &&
          !line.startsWith("For ") &&
          !line.startsWith("Food") &&
          !line.startsWith("Known") &&
          !line.startsWith("Get ") &&
          !line.startsWith("Want ") &&
          !line.startsWith("Fans ") &&
          !line.includes("Season") &&
          !line.includes("cheftestant") &&
          !line.includes("competing") &&
          !line.includes("restaurant") &&
          /^[A-Z]/.test(line) &&
          (line.split(" ").length <= 5) &&
          !hometown && !city && !occupation
        ) {
          // This might be a new contestant name
          // Save previous if exists
          currentName = line.replace(/[""]/g, '"');
          hometown = ""; city = ""; occupation = "";
        }
      }
    } else {
      // Strategy 2: Simple format — one name per line, optionally "Name - Bio" or "Name | Bio"
      for (const line of lines) {
        const separators = [" - ", " – ", " — ", " | ", "\t"];
        let name = line;
        let bio = "";
        for (const sep of separators) {
          if (line.includes(sep)) {
            const parts = line.split(sep);
            name = parts[0].trim();
            bio = parts.slice(1).join(sep).trim();
            break;
          }
        }
        if (name && name.length > 1 && name.length < 80) {
          contestants.push({ name, bio });
        }
      }
    }

    setParsed(contestants);
  }

  function applyBulk() {
    if (!parsed || parsed.length === 0) return;
    const existing = league.contestants || [];
    const newContestants = [...existing];

    for (const p of parsed) {
      const id = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, "");
      if (!newContestants.find(c => c.id === id)) {
        // Generate short name: "First L." format
        const parts = p.name.split(" ");
        const shortName = parts.length > 1
          ? parts[0] + " " + parts[parts.length - 1][0] + "."
          : parts[0];
        newContestants.push({
          id,
          name: shortName,
          bio: (p.name !== shortName ? p.name + " · " : "") + p.bio,
          gender: "",
          status: "active",
        });
      }
    }

    onUpdate({ ...league, contestants: newContestants });
    onClose();
  }

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ background:"#12121f",borderRadius:14,border:"1px solid #2a2a4a",maxWidth:500,width:"100%",maxHeight:"90vh",overflow:"auto",padding:20 }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
          <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:16,color:"#e8e8f0" }}>Bulk Add Contestants</h3>
          <button onClick={onClose} style={{ background:"none",border:"none",color:"#6a6a8a",cursor:"pointer",fontSize:18 }}>✕</button>
        </div>

        <div style={{ fontSize:12,color:"#6a6a8a",marginBottom:12,lineHeight:1.4 }}>
          Paste text from a cast page (like Bravo's Top Chef page) or a simple list of names. For a simple list, use one name per line, optionally with " - bio" after each name.
        </div>

        <textarea value={rawText} onChange={e=>setRawText(e.target.value)} placeholder="Paste cast page text or name list here..." rows={8} style={{
          width:"100%",padding:"10px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:8,
          color:"#e8e8f0",fontSize:13,fontFamily:"'Outfit',sans-serif",resize:"vertical",marginBottom:10,
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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TEAMS TAB
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function TeamsTab({ league, onUpdate, setModal, setEditing, readOnly }) {
  const [expanded, setExpanded] = useState(null);
  const [viewWeek, setViewWeek] = useState(String(league.currentWeek || 1));

  const weeks = Object.keys(league.weeklyScores || {}).sort((a,b)=>+a - +b);
  const weekOpts = Array.from({length:Math.max(league.currentWeek||1,1)},(_,i)=>({value:String(i+1),label:`Week ${i+1}`}));

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
    const ws = league.weeklyScores?.[weekNum] || {};
    return calcContestantWeekPoints(ws, contestantId);
  }

  function getContestantSeasonPts(contestantId) {
    return weeks.reduce((sum, w) => sum + calcContestantWeekPoints(league.weeklyScores?.[w]||{}, contestantId), 0);
  }

  function getTeamWeekTotal(team, weekNum) {
    if (weekNum === "season") {
      return weeks.reduce((sum, w) => sum + calcTeamWeekPoints(league, team, w), 0);
    }
    return calcTeamWeekPoints(league, team, weekNum);
  }

  // Sort teams by the selected week's score
  const sortedTeams = [...(league.teams||[])].sort((a,b) => getTeamWeekTotal(b, viewWeek) - getTeamWeekTotal(a, viewWeek));

  return (
    <div>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8 }}>
        <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>Teams</h3>
        <div style={{ display:"flex",gap:6,alignItems:"center" }}>
          {!readOnly && <Btn small onClick={()=>{setEditing(null);setModal("add-team")}}><Icon name="plus" size={14}/> Add Team</Btn>}
        </div>
      </div>

      {/* Week selector */}
      <Select value={viewWeek} onChange={e=>setViewWeek(e.target.value)} options={weekOpts} />

      {sortedTeams.length===0 ? <EmptyState message="No teams yet."/> : (
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {sortedTeams.map(team => {
            const isExp = expanded===team.id;
            const roster = getTeamRosterForWeek(team, viewWeek);
            const teamTotal = Math.round(getTeamWeekTotal(team, viewWeek) * 10) / 10;
            return (
              <div key={team.id} style={{ background:"#12121f",border:"1px solid #1e1e38",borderRadius:10,overflow:"hidden" }}>
                <div style={{ display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer" }}
                  onClick={()=>setExpanded(isExp?null:team.id)}>
                  <div style={{ width:40,height:40,borderRadius:10,background:"linear-gradient(135deg,#2a2a5a,#3a3a6a)",display:"flex",alignItems:"center",justifyContent:"center" }}><Icon name="users" size={20}/></div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:"#e8e8f0",fontWeight:700,fontSize:14 }}>{team.name}</div>
                    <div style={{ color:"#6a6a8a",fontSize:11,marginTop:2 }}>{team.owner} · {roster.length} rostered</div>
                  </div>
                  <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:20,fontWeight:900,
                    color:teamTotal>0?"#4ecdc4":teamTotal<0?"#e94560":"#6a6a8a",minWidth:45,textAlign:"right" }}>
                    {teamTotal}
                  </div>
                  <div style={{ transform:isExp?"rotate(90deg)":"none",transition:"transform 0.15s ease",color:"#6a6a8a" }}><Icon name="chevron" size={16}/></div>
                </div>
                {isExp && (
                  <div style={{ padding:"0 16px 14px",borderTop:"1px solid #1e1e38" }}>
                    <div style={{ paddingTop:12 }}>
                      <div style={{ fontSize:11,fontWeight:600,color:"#6a6a8a",textTransform:"uppercase",marginBottom:8,letterSpacing:"0.05em" }}>
                        {league.format==="captains"?"Depth Chart":"Roster"} — {viewWeek==="season"?"Season":"Week "+viewWeek}
                      </div>
                      {roster.length===0 ? <div style={{ color:"#4a4a6a",fontSize:12,fontStyle:"italic" }}>Empty roster</div> :
                        roster.map((c,idx)=>{
                          const basePts = getContestantWeekPts(c.id, viewWeek);
                          const multipliedPts = Math.round(basePts * c.multiplier * 10) / 10;
                          const tribeColor = getTribeColor(league, c);
                          const isMerged = league.merged || false;
                          // Season stats
                          const seasonPts = Math.round(weeks.reduce((s,w) => s + calcContestantWeekPoints(league.weeklyScores?.[w]||{}, c.id), 0)*10)/10;
                          const lastWk = weeks.length > 0 ? Math.round(calcContestantWeekPoints(league.weeklyScores?.[weeks[weeks.length-1]]||{}, c.id)*10)/10 : 0;
                          let bestWk = null, bestPts = -Infinity;
                          weeks.forEach(w => { const p = calcContestantWeekPoints(league.weeklyScores?.[w]||{}, c.id); if(p>bestPts){bestPts=p;bestWk=w;} });
                          bestPts = Math.round((bestPts===-Infinity?0:bestPts)*10)/10;
                          return (
                            <div key={c.id+(c.role||idx)} style={{ padding:"10px 0",borderBottom:"1px solid #1a1a30" }}>
                              <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                                <div style={{ width:30,height:30,borderRadius:"50%",flexShrink:0,
                                  background:c.status==="eliminated"?"#2a2a4a":tribeColor,
                                  display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff"
                                }}>{c.name?.[0]?.toUpperCase()}</div>
                                <div style={{ flex:1 }}>
                                  <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                                    <span style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>{c.name}</span>
                                    <MultiplierBadge role={c.role}/>
                                    {c.status==="eliminated" && <span style={{ color:"#e94560",fontSize:9 }}>ELIM</span>}
                                  </div>
                                  <div style={{ display:"flex",gap:4,marginTop:2 }}>
                                    {!isMerged && c.tribe && <span style={{ fontSize:9,fontWeight:600,padding:"1px 5px",borderRadius:3,background:tribeColor+"22",color:tribeColor }}>{c.tribe}</span>}
                                  </div>
                                </div>
                                <div style={{ textAlign:"right" }}>
                                  {basePts !== 0 && c.multiplier > 1 && (
                                    <div style={{ fontSize:9,color:"#6a6a8a" }}>{Math.round(basePts*10)/10} × {c.multiplier}</div>
                                  )}
                                  <div style={{ fontSize:16,fontWeight:800,fontFamily:"'Anybody',sans-serif",
                                    color:multipliedPts>0?"#4ecdc4":multipliedPts<0?"#e94560":"#6a6a8a"
                                  }}>
                                    {multipliedPts !== 0 ? (multipliedPts>0?"+":"") + multipliedPts : "—"}
                                  </div>
                                </div>
                              </div>
                              <div style={{ display:"flex",gap:14,fontSize:10,color:"#6a6a8a",marginTop:5,paddingLeft:40 }}>
                                <span>Last: <span style={{ color:lastWk>0?"#4ecdc4":lastWk<0?"#e94560":"#6a6a8a",fontWeight:600 }}>{lastWk>0?"+":""}{lastWk}</span></span>
                                <span>Best: <span style={{ color:"#f5a623",fontWeight:600 }}>{bestPts>0?"+":""}{bestPts}</span>{bestWk?` (Wk ${bestWk})`:""}</span>
                                <span>Season: <span style={{ fontWeight:600,color:"#ccc" }}>{seasonPts}</span></span>
                              </div>
                            </div>
                          );
                        })
                      }
                      {!readOnly && (
                      <TeamCardActions team={team} league={league} onUpdate={onUpdate} setEditing={setEditing} setModal={setModal} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let c = "";
    for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
    return c;
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
          <div style={{ fontSize:10,color:"#4a4a6a",marginTop:4 }}>Send this code to {team.owner}. They'll enter it on the login screen.</div>
        </div>
      )}
    </div>
  );
}
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ScoringTab({ league, onUpdate }) {
  const [selectedWeek, setSelectedWeek] = useState(String(league.currentWeek||1));
  const [edits, setEdits] = useState({});
  const [selectedRule, setSelectedRule] = useState(null);
  const [view, setView] = useState("events"); // "events" | "assign" | "summary"

  const weekScores = league.weeklyScores?.[selectedWeek] || {};
  const activeContestants = (league.contestants||[]).filter(c=>c.status!=="eliminated");
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
    const memberIds = (tribes[tribeName]||[]).filter(id => activeContestants.some(c=>c.id===id));
    const allActive = memberIds.every(id => getCount(id, rule.id, rule.points) > 0);
    memberIds.forEach(id => setScore(id, rule.id, rule.points, allActive ? 0 : 1));
  }

  function selectAllActive(rule) {
    const allActive = activeContestants.every(c => getCount(c.id, rule.id, rule.points) > 0);
    activeContestants.forEach(c => setScore(c.id, rule.id, rule.points, allActive ? 0 : 1));
  }

  function saveScores() {
    const merged = { ...(league.weeklyScores||{}), [selectedWeek]: { ...weekScores, ...edits } };
    onUpdate({ ...league, weeklyScores: merged });
    setEdits({});
  }

  function discardChanges() {
    setEdits({});
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

    onUpdate({ ...league, currentWeek: nextWeek, teams: updatedTeams, contestants: updatedContestants });
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
    return activeContestants.filter(c => getCount(c.id, rule.id, rule.points) > 0).length;
  }

  // Summary: all contestants with any score this week
  function getSummary() {
    return activeContestants.map(c => {
      const merged = getMerged(c.id);
      const events = [];
      (league.scoringRules||[]).forEach(r => {
        const count = getCount(c.id, r.id, r.points);
        if (count > 0) events.push({ rule: r, count, pts: Math.round(count * r.points * 10) / 10 });
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
          {view === "events" ? "Score Episode" : view === "assign" ? "" : "Week Summary"}
        </h3>
        <Select value={selectedWeek} onChange={e=>{setSelectedWeek(e.target.value);setEdits({});setView("events");setSelectedRule(null)}}
          options={Array.from({length:Math.max(league.currentWeek||1,1)+2},(_,i)=>({value:String(i+1),label:`Week ${i+1}`}))} />
      </div>

      {/* View tabs */}
      <div style={{ display:"flex",gap:6,marginBottom:16 }}>
        {[{id:"events",label:"Score Events"},{id:"summary",label:"Summary"}].map(t=>(
          <button key={t.id} onClick={()=>{setView(t.id);setSelectedRule(null)}} style={{
            padding:"6px 14px",borderRadius:99,border:"none",cursor:"pointer",fontSize:12,fontWeight:600,
            background:view===t.id||( view==="assign"&&t.id==="events")?"#e9456033":"#1e1e38",
            color:view===t.id||(view==="assign"&&t.id==="events")?"#e94560":"#8888aa",fontFamily:"'Outfit',sans-serif",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ─── EVENT LIST VIEW ─── */}
      {view === "events" && (
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
                      <div>
                        <div style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>{r.label}</div>
                        <div style={{ fontSize:11,color:r.points>=0?"#4ecdc4":"#e94560",marginTop:2 }}>
                          {r.points>0?"+":""}{r.points} pts{r.points===-1||r.points===1?" each":""}
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
      {view === "assign" && rule && (
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
            <div style={{ color:rule.points>=0?"#4ecdc4":"#e94560",fontSize:13,marginTop:2 }}>
              {rule.points>0?"+":""}{rule.points} pts per occurrence
            </div>
          </div>

          {/* Tribe quick-select buttons */}
          {tribeNames.length > 0 && !isMerged && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11,fontWeight:600,color:"#6a6a8a",textTransform:"uppercase",marginBottom:6 }}>Quick Select</div>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                {tribeNames.map(tribe => {
                  const memberIds = (tribes[tribe]||[]).filter(id => activeContestants.some(c=>c.id===id));
                  const allOn = memberIds.length > 0 && memberIds.every(id => getCount(id, rule.id, rule.points) > 0);
                  const tribeColor = (league.tribeColors||{})[tribe] || "#ccc";
                  return (
                    <button key={tribe} onClick={()=>toggleTribe(tribe, rule)} style={{
                      padding:"7px 14px",borderRadius:8,border:allOn?`2px solid ${tribeColor}`:"2px solid transparent",cursor:"pointer",fontSize:12,fontWeight:700,
                      background:allOn?tribeColor+"33":"#1e1e38",color:allOn?tribeColor:"#ccc",
                      fontFamily:"'Outfit',sans-serif",transition:"all 0.1s ease",
                      display:"flex",alignItems:"center",gap:6,
                    }}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:tribeColor,flexShrink:0}}></span>
                      {allOn ? "✓ " : ""}{tribe} ({memberIds.length})
                    </button>
                  );
                })}
                <button onClick={()=>selectAllActive(rule)} style={{
                  padding:"7px 14px",borderRadius:8,border:"1px solid #2a2a4a",cursor:"pointer",fontSize:12,fontWeight:600,
                  background:"transparent",color:"#8888aa",fontFamily:"'Outfit',sans-serif",
                }}>
                  {activeContestants.every(c => getCount(c.id, rule.id, rule.points) > 0) ? "Deselect All" : "Select All"}
                </button>
              </div>
            </div>
          )}

          {/* Contestant list grouped by tribe */}
          {tribeNames.length > 0 && !isMerged ? tribeNames.map(tribe => {
            const members = activeContestants.filter(c => c.tribe === tribe).sort((a,b) => a.name.localeCompare(b.name));
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
                        <button onClick={()=>toggleContestant(c.id, rule)} style={{
                          width:32,height:32,borderRadius:8,border:isOn?"none":"2px solid #3a3a5a",cursor:"pointer",
                          background:isOn?(rule.points>=0?"#4ecdc4":"#e94560"):"transparent",
                          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                        }}>
                          {isOn && <Icon name="check" size={14}/>}
                        </button>
                        <div style={{ flex:1,cursor:"pointer" }} onClick={()=>toggleContestant(c.id, rule)}>
                          <span style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>{c.name}</span>
                        </div>
                        {isOn && (
                          <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                            <button onClick={()=>setScore(c.id,rule.id,rule.points,Math.max(0,count-1))} style={{
                              width:32,height:32,borderRadius:8,border:"1px solid #2a2a4a",background:"#1e1e38",
                              color:"#ccc",cursor:"pointer",fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",
                            }}>−</button>
                            <span style={{ color:"#e8e8f0",fontWeight:700,fontSize:14,minWidth:20,textAlign:"center" }}>{count}</span>
                            <button onClick={()=>setScore(c.id,rule.id,rule.points,count+1)} style={{
                              width:32,height:32,borderRadius:8,border:"1px solid #2a2a4a",background:"#1e1e38",
                              color:"#ccc",cursor:"pointer",fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",
                            }}>+</button>
                            <span style={{ color:rule.points>=0?"#4ecdc4":"#e94560",fontSize:12,fontWeight:600,minWidth:40,textAlign:"right" }}>
                              {(count*rule.points)>0?"+"  :""}{Math.round(count*rule.points*10)/10}
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
              {[...activeContestants].sort((a,b) => a.name.localeCompare(b.name)).map(c => {
                const count = getCount(c.id, rule.id, rule.points);
                const isOn = count > 0;
                return (
                  <div key={c.id} style={{
                    display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:10,
                    background:isOn?(rule.points>=0?"#4ecdc418":"#e9456018"):"#12121f",
                    border:isOn?(rule.points>=0?"1px solid #4ecdc433":"1px solid #e9456033"):"1px solid #1e1e38",
                  }}>
                    <button onClick={()=>toggleContestant(c.id, rule)} style={{
                      width:32,height:32,borderRadius:8,border:isOn?"none":"2px solid #3a3a5a",cursor:"pointer",
                      background:isOn?(rule.points>=0?"#4ecdc4":"#e94560"):"transparent",
                      display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,
                    }}>
                      {isOn && <Icon name="check" size={14}/>}
                    </button>
                    <div style={{ flex:1,cursor:"pointer" }} onClick={()=>toggleContestant(c.id, rule)}>
                      <span style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>{c.name}</span>
                    </div>
                    {isOn && (
                      <div style={{ display:"flex",alignItems:"center",gap:4 }}>
                        <button onClick={()=>setScore(c.id,rule.id,rule.points,Math.max(0,count-1))} style={{
                          width:32,height:32,borderRadius:8,border:"1px solid #2a2a4a",background:"#1e1e38",
                          color:"#ccc",cursor:"pointer",fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",
                        }}>−</button>
                        <span style={{ color:"#e8e8f0",fontWeight:700,fontSize:14,minWidth:20,textAlign:"center" }}>{count}</span>
                        <button onClick={()=>setScore(c.id,rule.id,rule.points,count+1)} style={{
                          width:32,height:32,borderRadius:8,border:"1px solid #2a2a4a",background:"#1e1e38",
                          color:"#ccc",cursor:"pointer",fontSize:15,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",
                        }}>+</button>
                        <span style={{ color:rule.points>=0?"#4ecdc4":"#e94560",fontSize:12,fontWeight:600,minWidth:40,textAlign:"right" }}>
                          {(count*rule.points)>0?"+":""}{Math.round(count*rule.points*10)/10}
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
          {getSummary().length === 0 ? <EmptyState message="No scores entered for this week yet." /> : (
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
                      {c.total>0?"+":""}{c.total}
                    </span>
                  </div>
                  <div style={{ display:"flex",flexWrap:"wrap",gap:4 }}>
                    {c.events.map(e => (
                      <span key={e.rule.id} style={{
                        fontSize:11,padding:"2px 8px",borderRadius:4,
                        background:e.rule.points>=0?"#4ecdc422":"#e9456022",
                        color:e.rule.points>=0?"#4ecdc4":"#e94560",
                      }}>
                        {e.rule.label}{e.count>1?` ×${e.count}`:""} ({e.pts>0?"+":""}{e.pts})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Save / Advance buttons */}
      {hasChanges ? (
        <div style={{ position:"sticky",bottom:16,marginTop:20,padding:"14px 16px",background:"linear-gradient(135deg,#1a0a10,#12121f)",borderRadius:14,border:"1px solid #e94560",
          display:"flex",gap:10,justifyContent:"center",alignItems:"center",boxShadow:"0 -4px 24px rgba(233,69,96,0.2)" }}>
          <Btn small variant="ghost" onClick={discardChanges}>Discard</Btn>
          <Btn onClick={saveScores}><Icon name="save" size={14}/> Save Week {selectedWeek}</Btn>
        </div>
      ) : (
        <div style={{ display:"flex",gap:8,marginTop:20 }}>
          <Btn variant="secondary" onClick={advanceWeek} small>Advance to Week {(league.currentWeek||1)+1}</Btn>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WEEKLY DRAFT TAB (Standard format)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function WeeklyDraftTab({ league, onUpdate, standings }) {
  const [draftWeek, setDraftWeek] = useState(String(league.currentWeek||1));
  const [currentPick, setCurrentPick] = useState(0);
  const [draftStarted, setDraftStarted] = useState(false);

  const config = league.standardConfig || { picksPerManager: 2, genderedDraft: false };
  const numTeams = (league.teams||[]).length;
  const totalPicks = numTeams * config.picksPerManager;

  const draftOrder = useMemo(() => {
    if (standings.length === 0) return (league.teams||[]).map(t=>t.id);
    return getInverseDraftOrder(standings);
  }, [standings, league.teams]);

  const draftedThisWeek = useMemo(() => {
    const ids = new Set();
    (league.teams||[]).forEach(t => { (t.weeklyRosters?.[draftWeek]||[]).forEach(id => ids.add(id)); });
    return ids;
  }, [league, draftWeek]);

  const activeContestants = (league.contestants||[]).filter(c => c.status !== "eliminated");
  const available = activeContestants.filter(c => !draftedThisWeek.has(c.id));

  function getCurrentTeamId() {
    if (numTeams === 0) return null;
    const round = Math.floor(currentPick / numTeams);
    const pos = currentPick % numTeams;
    const idx = round % 2 === 0 ? pos : numTeams - 1 - pos;
    return draftOrder[idx];
  }

  function startDraft() {
    const updated = { ...league, teams: league.teams.map(t => ({
      ...t, weeklyRosters: { ...(t.weeklyRosters||{}), [draftWeek]: [] }
    }))};
    onUpdate(updated);
    setCurrentPick(0);
    setDraftStarted(true);
  }

  function makePick(contestantId) {
    const teamId = getCurrentTeamId();
    if (!teamId) return;
    const updated = { ...league, teams: league.teams.map(t =>
      t.id === teamId ? { ...t, weeklyRosters: { ...(t.weeklyRosters||{}), [draftWeek]: [...(t.weeklyRosters?.[draftWeek]||[]), contestantId] } } : t
    )};
    onUpdate(updated);
    setCurrentPick(prev => prev + 1);
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
        <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>Weekly Draft</h3>
        <Select value={draftWeek} onChange={e=>{setDraftWeek(e.target.value);setDraftStarted(false);setCurrentPick(0)}}
          options={Array.from({length:Math.max(league.currentWeek||1,1)+2},(_,i)=>({value:String(i+1),label:`Week ${i+1}`}))} />
      </div>

      {numTeams < 2 ? <EmptyState message="Need at least 2 teams to draft."/> :
       !draftStarted ? (
        <div>
          <div style={{ padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",marginBottom:16 }}>
            <div style={{ fontSize:13,fontWeight:700,color:"#e8e8f0",marginBottom:8 }}>Week {draftWeek} Draft Setup</div>
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
          <Btn onClick={startDraft} style={{ width:"100%",justifyContent:"center" }}><Icon name="grid" size={14}/> Start Week {draftWeek} Draft</Btn>
        </div>
      ) : isDone ? (
        <div style={{ textAlign:"center",padding:30,background:"linear-gradient(135deg,rgba(78,205,196,0.08),rgba(233,69,96,0.08))",borderRadius:12,border:"1px solid #2a2a4a" }}>
          <div style={{ fontSize:36,marginBottom:8 }}>🎉</div>
          <div style={{ color:"#e8e8f0",fontWeight:700,fontSize:16,fontFamily:"'Anybody',sans-serif" }}>Week {draftWeek} Draft Complete!</div>
          <div style={{ marginTop:16,display:"flex",flexWrap:"wrap",justifyContent:"center",gap:6 }}>
            {(league.teams||[]).map(t => (
              <div key={t.id} style={{ padding:"8px 14px",background:"#1e1e38",borderRadius:8,fontSize:12,textAlign:"left" }}>
                <div style={{ color:"#e8e8f0",fontWeight:700,marginBottom:4 }}>{t.name}</div>
                <div style={{ color:"#8888aa" }}>{(t.weeklyRosters?.[draftWeek]||[]).map(cid=>(league.contestants||[]).find(x=>x.id===cid)?.name).filter(Boolean).join(", ")||"—"}</div>
              </div>
            ))}
          </div>
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
          <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
            {filteredAvailable.map(c=>(
              <button key={c.id} onClick={()=>makePick(c.id)} style={{
                display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#12121f",
                border:"1px solid #1e1e38",borderRadius:8,cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif",transition:"all 0.1s ease",
              }} onMouseEnter={e=>{e.currentTarget.style.borderColor="#4ecdc4"}} onMouseLeave={e=>{e.currentTarget.style.borderColor="#1e1e38"}}>
                <div style={{ width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#e94560,#f5a623)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff" }}>{c.name?.[0]?.toUpperCase()}</div>
                <div style={{ flex:1 }}>
                  <div style={{ color:"#e8e8f0",fontWeight:600,fontSize:13 }}>{c.name} {c.gender && <span style={{ color:"#6a6a8a",fontSize:10 }}>({c.gender})</span>}</div>
                  <div style={{ color:"#6a6a8a",fontSize:11 }}>{c.bio||"—"}</div>
                </div>
                <span style={{ color:"#4ecdc4",fontSize:12,fontWeight:600 }}>Draft →</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DEPTH CHART TAB (Captains format)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function DepthChartTab({ league, onUpdate, lockedToTeamId, defaultTeamId, isCommissioner }) {
  const [selectedTeam, setSelectedTeam] = useState(lockedToTeamId || defaultTeamId || (league.teams||[])[0]?.id || "");
  const [localChart, setLocalChart] = useState({});
  const [editingName, setEditingName] = useState(false);
  const [teamName, setTeamName] = useState("");

  const team = (league.teams||[]).find(t=>t.id===selectedTeam);
  const regularSlots = league.captainsConfig?.regularSlots || 3;
  const activeContestants = (league.contestants||[]).filter(c=>c.status!=="eliminated");
  const currentWeek = league.currentWeek || 1;
  const weeks = Object.keys(league.weeklyScores || {}).sort((a,b)=>+a - +b);

  const savedChart = team?.depthChart || { captain: null, coCaptain: null, regulars: [] };
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
      return { id: c.id, total: Math.round(total*10)/10 };
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

  const swapLimitReached = currentWeek > 1 && swapsMade >= 1;

  useEffect(() => {
    if (team) {
      setLocalChart(team.depthChart || { captain: null, coCaptain: null, regulars: [] });
      setTeamName(team.name || "");
    }
  }, [selectedTeam, league]);

  function isNewPlayer(cid) {
    if (!lastWeekChart || lastWeekRosterIds.size === 0) return false;
    return cid && !lastWeekRosterIds.has(cid);
  }

  function canSelectPlayer(cid, currentSlotValue) {
    if (!cid) return true;
    if (lastWeekRosterIds.has(cid)) return true;
    if (cid === currentSlotValue) return true;
    if (!lastWeekChart || lastWeekRosterIds.size === 0) return true;
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
    const weekNum = String(currentWeek);
    const updatedTeams = league.teams.map(t => t.id !== selectedTeam ? t : {
      ...t,
      name: teamName.trim() || t.name,
      depthChart: { ...localChart },
      weeklyDepthCharts: { ...(t.weeklyDepthCharts||{}), [weekNum]: { ...localChart } },
    });
    onUpdate({ ...league, teams: updatedTeams });
    setEditingName(false);
  }

  function discardRosterChanges() {
    if (team) setLocalChart(team.depthChart || { captain: null, coCaptain: null, regulars: [] });
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
    return { ...c, ranking, lastWkPts: Math.round(lastWkPts*10)/10, tribeColor, bestWeek, bestPts: Math.round(bestPts*10)/10, isMerged };
  }

  function RosterRow({ label, slot, currentId, multiplierLabel, multiplierNum, color }) {
    // Available: all active contestants that pass swap rules (no duplicate filtering — swaps handle it)
    const available = activeContestants.filter(c => canSelectPlayer(c.id, currentId));
    const isInDropdown = currentId && available.some(c => c.id === currentId);
    const c = isInDropdown ? (league.contestants||[]).find(x=>x.id===currentId) : null;
    const isSwapped = isNewPlayer(currentId);
    const tribeColor = c ? getTribeColor(league, c) : "#2a2a4a";
    const weekBasePts = c ? calcContestantWeekPoints(league.weeklyScores?.[String(currentWeek)]||{}, c.id) : 0;
    const weekMultPts = Math.round(weekBasePts * multiplierNum * 10) / 10;

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
          {/* Tribe avatar (only if player set) */}
          {c && (
            <div style={{ width:28,height:28,borderRadius:"50%",background:c.status==="eliminated"?"#2a2a4a":tribeColor,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0 }}>
              {c.name?.[0]?.toUpperCase()}
            </div>
          )}
          {/* Player selector — always the dropdown */}
          <div style={{ flex:1,minWidth:0,position:"relative" }}>
            <select value={isInDropdown ? (currentId||"") : ""} onChange={e=>setSlotWithSwap(slot,e.target.value)} style={{
              width:"100%",padding:"8px 10px",background:c?"transparent":"#0d0d18",
              border:c?"1px solid transparent":"1px solid #2a2a4a",
              borderRadius:6,color:c?"#e8e8f0":"#6a6a8a",fontSize:13,fontWeight:c?600:400,
              fontFamily:"'Outfit',sans-serif",cursor:"pointer",
              appearance:c?"none":"auto",WebkitAppearance:c?"none":"auto",
            }}>
              <option value="">{c ? "— Remove player —" : "— Select contestant —"}</option>
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
                        {a.name}{existingSlot && !isCurrentSlot ? ` (swap ${existingSlot==="captain"?"C":existingSlot==="coCaptain"?"CC":"R"+(Number(existingSlot.replace("regular_",""))+1)})` : ""}{isNewPlayer(a.id)&&!currentRosterIds.has(a.id)?" ★":""}
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
                        {a.name}{existingSlot && !isCurrentSlot ? ` (swap ${existingSlot==="captain"?"C":existingSlot==="coCaptain"?"CC":"R"+(Number(existingSlot.replace("regular_",""))+1)})` : ""}{isNewPlayer(a.id)&&!currentRosterIds.has(a.id)?" ★":""}
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
                {weekMultPts !== 0 ? (weekMultPts>0?"+":"") + weekMultPts : "—"}
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
        <Badge color="#f5a623">Week {currentWeek}</Badge>
      </div>

      {/* Best Ball banner */}
      {league.bestBall && (
        <div style={{ padding:"10px 14px",background:"#4ecdc411",borderRadius:8,border:"1px solid #4ecdc433",marginBottom:14 }}>
          <div style={{ fontSize:12,color:"#4ecdc4",lineHeight:1.5,fontWeight:600 }}>Best Ball is ON — your lineup is auto-optimized each week. The highest scorer gets Hero (2x), second gets Side-Kick (1.5x), rest get Vigilante (1x).</div>
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
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div>
                <div style={{ color:"#e8e8f0",fontWeight:700,fontSize:18,fontFamily:"'Anybody',sans-serif" }}>{team.name}</div>
                <div style={{ color:"#6a6a8a",fontSize:12,marginTop:2 }}>Managed by {team.owner}</div>
              </div>
              <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:22,fontWeight:900,
                    color:teamWeekTotal>0?"#4ecdc4":teamWeekTotal<0?"#e94560":"#6a6a8a" }}>
                    {teamWeekTotal>0?"+":""}{teamWeekTotal}
                  </div>
                  <div style={{ fontSize:10,color:"#6a6a8a" }}>wk {currentWeek} total</div>
                </div>
                <button onClick={()=>setEditingName(true)} style={{ background:"none",border:"none",color:"#6a6a8a",cursor:"pointer",padding:4 }}>
                  <Icon name="edit" size={14}/>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Select label="Select Team" value={selectedTeam} onChange={e=>setSelectedTeam(e.target.value)}
          options={(league.teams||[]).map(t=>({value:t.id,label:`${t.name} (${t.owner})`}))} />
      )}

      {/* Swap tracker */}
      {currentWeek > 1 && lastWeekRosterIds.size > 0 && (
        <div style={{
          padding:"10px 14px",borderRadius:8,marginBottom:14,
          background: swapLimitReached ? "#e9456011" : "#4ecdc411",
          border: swapLimitReached ? "1px solid #e9456033" : "1px solid #4ecdc433",
        }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
            <div style={{ fontSize:12,fontWeight:600,color:swapLimitReached?"#e94560":"#4ecdc4" }}>
              Weekly Swap: {swapsMade} / 1 used
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
          <div style={{ fontSize:12,color:"#f5a623",lineHeight:1.5 }}>Week 1 — set your initial roster freely.</div>
        </div>
      )}

      {/* Roster locked banner */}
      {league.rostersLocked && !isCommissioner && (
        <div style={{ padding:"10px 14px",background:"#e9456011",borderRadius:8,border:"1px solid #e9456033",marginBottom:14,display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:16 }}>🔒</span>
          <div style={{ fontSize:12,color:"#e94560",lineHeight:1.4 }}>Rosters are locked. Changes are disabled until the commissioner unlocks them.</div>
        </div>
      )}
      {league.rostersLocked && isCommissioner && (
        <div style={{ padding:"10px 14px",background:"#f5a62311",borderRadius:8,border:"1px solid #f5a62333",marginBottom:14,display:"flex",alignItems:"center",gap:8 }}>
          <span style={{ fontSize:16 }}>🔒</span>
          <div style={{ flex:1,fontSize:12,color:"#f5a623",lineHeight:1.4 }}>Rosters are locked for managers. You can still edit as commissioner.</div>
        </div>
      )}

      {/* Roster table */}
      <div style={{ background:"#12121f",borderRadius:10,border:"1px solid #1e1e38",overflow:"hidden",
        opacity:(league.rostersLocked && !isCommissioner) ? 0.5 : 1,pointerEvents:(league.rostersLocked && !isCommissioner) ? "none" : "auto" }}>
        <div style={{ display:"flex",alignItems:"center",padding:"10px 12px",background:"#0d0d18",borderBottom:"1px solid #1e1e38" }}>
          <div style={{ width:38,fontSize:10,fontWeight:600,color:"#4a4a6a",textAlign:"center",flexShrink:0 }}>Slot</div>
          <div style={{ flex:1,fontSize:10,fontWeight:600,color:"#4a4a6a",paddingLeft:10 }}>Player</div>
          <div style={{ width:46,fontSize:10,fontWeight:600,color:"#4a4a6a",textAlign:"right" }}>Wk {currentWeek}</div>
        </div>
        <RosterRow label="H" slot="captain" currentId={localChart.captain} multiplierLabel="2×" multiplierNum={2} color="#f5a623" />
        <RosterRow label="SK" slot="coCaptain" currentId={localChart.coCaptain} multiplierLabel="1.5×" multiplierNum={1.5} color="#4ecdc4" />
        {Array.from({length:regularSlots}).map((_,i) => (
          <RosterRow key={i} label={`V${i+1}`} slot={`regular_${i}`} currentId={(localChart.regulars||[])[i]} multiplierLabel="1×" multiplierNum={1} color="#8888aa" />
        ))}
      </div>

      {/* ─── HOT PICKS: Who should I roster? ─── */}
      {!league.rostersLocked && (()=>{
        const rosteredIds = new Set();
        if (localChart.captain) rosteredIds.add(localChart.captain);
        if (localChart.coCaptain) rosteredIds.add(localChart.coCaptain);
        (localChart.regulars||[]).forEach(id => rosteredIds.add(id));

        const available = activeContestants.filter(c => !rosteredIds.has(c.id));
        const ranked = available.map(c => {
          const total = weeks.reduce((s,w) => s + calcContestantWeekPoints(league.weeklyScores?.[w]||{}, c.id), 0);
          const prevWeek = String((league.currentWeek||1) - 1);
          const lastWk = prevWeek !== "0" ? calcContestantWeekPoints(league.weeklyScores?.[prevWeek]||{}, c.id) : 0;
          return { ...c, total: Math.round(total*10)/10, lastWk: Math.round(lastWk*10)/10, tribeColor: getTribeColor(league, c) };
        }).sort((a,b) => b.total - a.total).slice(0, 5);

        if (ranked.length === 0) return null;
        return (
          <div style={{ marginTop:20 }}>
            <div style={{ fontSize:14,fontWeight:800,fontFamily:"'Anybody',sans-serif",color:"#f0f0f5",marginBottom:10,display:"flex",alignItems:"center",gap:6 }}>
              <span style={{ fontSize:16 }}>🔥</span> Hot Picks
            </div>
            <div style={{ fontSize:11,color:"#6a6a8a",marginBottom:10 }}>Top available contestants not on your roster</div>
            <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
              {ranked.map((c,i) => (
                <div key={c.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
                  <div style={{ width:28,height:28,borderRadius:8,background:c.tribeColor,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0 }}>{c.name?.[0]}</div>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ color:"#e8e8f0",fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{c.name}</div>
                    <div style={{ fontSize:10,color:"#6a6a8a" }}>#{contestantRankings[c.id]?.rank || "?"} overall{c.lastWk!==0?` · Last wk: ${c.lastWk>0?"+":""}${c.lastWk}`:""}</div>
                  </div>
                  <div style={{ textAlign:"right",flexShrink:0 }}>
                    <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:15,fontWeight:800,color:c.total>0?"#4ecdc4":c.total<0?"#e94560":"#6a6a8a" }}>{c.total>0?"+":""}{c.total}</div>
                    <div style={{ fontSize:9,color:"#4a4a6a" }}>season</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ─── MY TEAM HISTORY ─── */}
      {team && weeks.length > 0 && (
        <div style={{ marginTop:20 }}>
          <div style={{ fontSize:14,fontWeight:800,fontFamily:"'Anybody',sans-serif",color:"#f0f0f5",marginBottom:10 }}>Team History</div>
          <div style={{ display:"flex",gap:6,overflowX:"auto",paddingBottom:4,WebkitOverflowScrolling:"touch" }}>
            {weeks.map(w => {
              const pts = Math.round(calcTeamWeekPoints(league, team, w) * 10) / 10;
              const isCurrentWeek = w === String(currentWeek);
              return (
                <div key={w} style={{ minWidth:60,padding:"10px 8px",background:isCurrentWeek?"#e9456015":"#12121f",borderRadius:10,
                  border:isCurrentWeek?"1px solid #e9456033":"1px solid #1e1e38",textAlign:"center",flexShrink:0 }}>
                  <div style={{ fontSize:9,color:"#6a6a8a",fontWeight:600,marginBottom:4 }}>WK {w}</div>
                  <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:16,fontWeight:800,
                    color:pts>0?"#4ecdc4":pts<0?"#e94560":"#4a4a6a" }}>{pts>0?"+":""}{pts}</div>
                </div>
              );
            })}
          </div>
          {(()=>{
            const seasonTotal = weeks.reduce((s,w) => s + calcTeamWeekPoints(league, team, w), 0);
            const avg = weeks.length > 0 ? Math.round(seasonTotal / weeks.length * 10) / 10 : 0;
            return (
              <div style={{ display:"flex",gap:12,marginTop:10 }}>
                <div style={{ flex:1,padding:"10px",background:"#12121f",borderRadius:8,border:"1px solid #1e1e38",textAlign:"center" }}>
                  <div style={{ fontSize:9,color:"#6a6a8a",fontWeight:600 }}>SEASON TOTAL</div>
                  <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:18,fontWeight:800,color:"#e8e8f0" }}>{Math.round(seasonTotal*10)/10}</div>
                </div>
                <div style={{ flex:1,padding:"10px",background:"#12121f",borderRadius:8,border:"1px solid #1e1e38",textAlign:"center" }}>
                  <div style={{ fontSize:9,color:"#6a6a8a",fontWeight:600 }}>AVG / WEEK</div>
                  <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:18,fontWeight:800,color:"#f5a623" }}>{avg>0?"+":""}{avg}</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {hasChanges && (
        <div style={{ position:"sticky",bottom:16,marginTop:12,padding:"14px 16px",background:"linear-gradient(135deg,#0a1a18,#12121f)",borderRadius:14,border:"1px solid #4ecdc4",
          display:"flex",gap:10,justifyContent:"center",alignItems:"center",boxShadow:"0 -4px 24px rgba(78,205,196,0.15)" }}>
          <Btn small variant="ghost" onClick={discardRosterChanges}>Discard</Btn>
          <Btn onClick={saveDepthChart}><Icon name="save" size={14}/> Save Roster</Btn>
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
          <div style={{ width:56,height:56,borderRadius:14,background:isEliminated?"#2a2a4a":getTribeColor(league,myContestant),display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:700,color:"#fff",margin:"0 auto 12px" }}>{myContestant.name?.[0]}</div>
          <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:22,fontWeight:800,color:isEliminated?"#e94560":"#4ecdc4" }}>{myContestant.name}</div>
          <div style={{ fontSize:13,color:isEliminated?"#e94560":"#4ecdc4",marginTop:4 }}>
            {isEliminated ? "ELIMINATED" + (myContestant.eliminatedWeek ? " — Week " + myContestant.eliminatedWeek : "") + " — YOU'RE OUT" : "STILL ALIVE"}
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
                  <div style={{ width:32,height:32,borderRadius:8,background:getTribeColor(league,c),display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff" }}>{c.name?.[0]}</div>
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
                  <div style={{ width:28,height:28,borderRadius:8,background:getTribeColor(league,c),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff" }}>{c.name?.[0]}</div>
                  <div style={{ flex:1,fontSize:13,fontWeight:600,color:"#e8e8f0" }}>{c.name}</div>
                  <div style={{ fontSize:12,color:"#f5a623",fontWeight:700 }}>${prices[cid]||0}</div>
                  <div style={{ fontSize:12,color:pts>0?"#4ecdc4":"#6a6a8a",fontWeight:700 }}>{pts>0?"+":""}{Math.round(pts*10)/10}</div>
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
              <div style={{ width:28,height:28,borderRadius:8,background:getTribeColor(league,c),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff" }}>{c.name?.[0]}</div>
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
            <div style={{ width:28,height:28,borderRadius:8,background:getTribeColor(league,c),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff" }}>{c.name?.[0]}</div>
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
        <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>Weekly Pick</h3>
        <Badge color="#f5a623">Week {currentWeek}</Badge>
      </div>
      <div style={{ fontSize:13,color:"#6a6a8a",marginBottom:16 }}>Pick one contestant you think will survive this week. You can't reuse picks.</div>

      {currentPick ? (
        <div style={{ padding:"16px",background:"#0a1a18",borderRadius:12,border:"1px solid #4ecdc444",textAlign:"center",marginBottom:16 }}>
          <div style={{ fontSize:12,color:"#6a6a8a",marginBottom:6 }}>Your pick for Week {currentWeek}:</div>
          <div style={{ fontFamily:"'Anybody',sans-serif",fontSize:20,fontWeight:800,color:"#4ecdc4" }}>{allContestants.find(c=>c.id===currentPick)?.name || "Unknown"}</div>
          {!league.rostersLocked && <Btn small variant="ghost" onClick={()=>makePick(null)} style={{marginTop:8}}>Change</Btn>}
        </div>
      ) : (
        <div style={{ display:"flex",flexDirection:"column",gap:4 }}>
          {activeContestants.filter(c=>!usedPicks.has(c.id)).map(c => (
            <button key={c.id} onClick={()=>makePick(c.id)} style={{
              display:"flex",alignItems:"center",gap:10,padding:"12px 14px",borderRadius:10,
              background:"#12121f",border:"1px solid #1e1e38",cursor:"pointer",textAlign:"left",fontFamily:"'Outfit',sans-serif",
            }}>
              <div style={{ width:32,height:32,borderRadius:8,background:getTribeColor(league,c),display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff" }}>{c.name?.[0]}</div>
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
                  <Badge color="#6a6a8a">Wk {wk}</Badge>
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
        <Badge color="#f5a623">Week {currentWeek}</Badge>
      </div>

      {questions.length === 0 ? (
        <EmptyState message="No questions posted yet for this week. Check back before the episode!" />
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
          options={Array.from({length:Math.max(league.currentWeek||1,1)+2},(_,i)=>({value:String(i+1),label:"Week "+(i+1)}))} />
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
        <Input label="Question" placeholder='e.g. "Who gets eliminated this week?"' value={newText} onChange={e=>setNewText(e.target.value)} />
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
          <label style={{ color:"#8888aa",fontSize:12 }}>Week:</label>
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
        Upload your league spreadsheet. Reads: Scoring rules, Scoring Table (weekly scores), Teams (depth charts), Contestants (status, tribes). Existing bios are preserved.
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
            {Object.keys(d.weeklyScores).length > 0 && <Badge color="#f5a623">{Object.keys(d.weeklyScores).length} weeks of scores</Badge>}
            {Object.keys(d.tribes).length > 0 && <Badge color="#c44bbe">{Object.keys(d.tribes).length} tribes</Badge>}
            {d.maxWeek > 0 && <Badge color="#6a6a8a">Through wk {d.maxWeek}</Badge>}
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
              This will replace scoring rules, weekly scores, teams, and contestant status. Existing bios will be preserved. This cannot be undone.
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
                <div style={{ fontSize:10,color:"#6a6a8a",marginTop:4 }}>Scoring, eliminations, and week advances sync both ways.</div>
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

function SettingsTab({ league, onUpdate, onReset, allLeagues }) {
  const [editRules, setEditRules] = useState(false);
  const [rules, setRules] = useState(league.scoringRules||[]);
  const [newRule, setNewRule] = useState({ label:"", points:0 });
  const [editingInfo, setEditingInfo] = useState(false);
  const [leagueInfo, setLeagueInfo] = useState({
    name: league.name || "",
    showName: league.showName || "",
    seasonName: league.seasonName || "",
  });

  function saveRules() { onUpdate({...league,scoringRules:rules}); setEditRules(false); }
  function addCustomRule() {
    if (!newRule.label.trim()) return;
    setRules(prev=>[...prev,{id:"custom_"+generateId(),label:newRule.label,points:Number(newRule.points),category:"custom"}]);
    setNewRule({label:"",points:0});
  }
  function saveLeagueInfo() {
    onUpdate({ ...league, name: leagueInfo.name.trim(), showName: leagueInfo.showName.trim(), seasonName: leagueInfo.seasonName.trim() });
    setEditingInfo(false);
  }

  return (
    <div>
      <h3 style={{ margin:"0 0 16px",fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>League Settings</h3>

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
            <Input label="Season Name" value={leagueInfo.seasonName} onChange={e=>setLeagueInfo({...leagueInfo,seasonName:e.target.value})} />
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
              <span style={{ color:"#e8e8f0",fontSize:13,fontWeight:600 }}>{league.seasonName}</span>
            </div>
            <div style={{ display:"flex",justifyContent:"space-between",padding:"6px 0" }}>
              <span style={{ color:"#6a6a8a",fontSize:12 }}>Current Week</span>
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

      {/* Roster Lock */}
      <div style={{ marginBottom:20,padding:"16px",background:league.rostersLocked?"#e9456011":"#12121f",borderRadius:10,
        border:league.rostersLocked?"1px solid #e9456033":"1px solid #1e1e38",transition:"all 0.2s ease" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
          <div>
            <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",display:"flex",alignItems:"center",gap:6 }}>
              {league.rostersLocked ? "🔒" : "🔓"} Roster Lock
            </div>
            <div style={{ fontSize:12,color:"#6a6a8a",marginTop:4 }}>
              {league.rostersLocked
                ? "Rosters are locked. Managers cannot make changes."
                : "Rosters are open. Managers can edit their rosters."}
            </div>
          </div>
          <Btn small variant={league.rostersLocked?"danger":"secondary"}
            onClick={()=>onUpdate({...league,rostersLocked:!league.rostersLocked})}>
            {league.rostersLocked ? "Unlock" : "Lock"}
          </Btn>
        </div>
      </div>

      {/* Linked Scoring */}
      <LinkedScoringSection league={league} allLeagues={allLeagues} onUpdate={onUpdate} />

      <div style={{ marginBottom:20,padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
        <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:8 }}>
          {FORMAT_INFO[league.format]?.icon} {FORMAT_INFO[league.format]?.name} Format
        </div>
        <div style={{ fontSize:12,color:"#8888aa",lineHeight:1.5 }}>{FORMAT_INFO[league.format]?.desc}</div>
        {league.format==="captains" && <div style={{ fontSize:12,color:"#6a6a8a",marginTop:6 }}>Regular slots: {league.captainsConfig?.regularSlots||3}</div>}
        {league.format==="standard" && <div style={{ fontSize:12,color:"#6a6a8a",marginTop:6 }}>Picks/manager: {league.standardConfig?.picksPerManager||2} · Gendered: {league.standardConfig?.genderedDraft?"Yes":"No"}</div>}
      </div>

      <div style={{ marginBottom:20,padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
          <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0" }}>Scoring Rules</div>
          <Btn small variant={editRules?"primary":"ghost"} onClick={()=>editRules?saveRules():setEditRules(true)}>
            {editRules?<><Icon name="save" size={12}/> Save</>:<><Icon name="edit" size={12}/> Edit</>}
          </Btn>
        </div>
        {rules.map((r,i)=>(
          <div key={r.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:"1px solid #1a1a30" }}>
            <span style={{ flex:1,color:"#ccc",fontSize:13 }}>{r.label}</span>
            {editRules ? (
              <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                <input type="number" value={r.points} onChange={e=>{ const u=[...rules]; u[i]={...u[i],points:Number(e.target.value)}; setRules(u); }}
                  style={{ width:60,padding:"4px 8px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:4,color:"#e8e8f0",fontSize:13,textAlign:"center",fontFamily:"'Outfit',sans-serif" }} />
                <button onClick={()=>setRules(rules.filter((_,j)=>j!==i))} style={{ background:"none",border:"none",color:"#e94560",cursor:"pointer",padding:2 }}><Icon name="trash" size={12}/></button>
              </div>
            ) : <Badge color={r.points>=0?"#4ecdc4":"#e94560"}>{r.points>0?"+":""}{r.points}</Badge>}
          </div>
        ))}
        {editRules && (
          <div style={{ display:"flex",gap:6,marginTop:10 }}>
            <input placeholder="Rule name" value={newRule.label} onChange={e=>setNewRule({...newRule,label:e.target.value})}
              style={{ flex:1,padding:"7px 10px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,color:"#e8e8f0",fontSize:12,fontFamily:"'Outfit',sans-serif" }} />
            <input type="number" placeholder="Pts" value={newRule.points} onChange={e=>setNewRule({...newRule,points:e.target.value})}
              style={{ width:60,padding:"7px 8px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,color:"#e8e8f0",fontSize:12,textAlign:"center",fontFamily:"'Outfit',sans-serif" }} />
            <Btn small variant="secondary" onClick={addCustomRule}><Icon name="plus" size={12}/></Btn>
          </div>
        )}
      </div>

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
                  {c.eliminatedWeek && <span style={{ color:"#e94560",fontSize:10,marginLeft:6 }}>Week {c.eliminatedWeek}</span>}
                </div>
                <Btn small variant="ghost" onClick={()=>onUpdate({...league,contestants:league.contestants.map(x=>x.id===c.id?{...x,status:"active",eliminatedWeek:null}:x)})}>Reinstate</Btn>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Import from XLSX */}
      <ImportXLSXSection league={league} onUpdate={onUpdate} />

      {/* Transfer Commissioner */}
      {(league.teams||[]).length > 0 && (
        <div style={{ marginBottom:20,padding:"16px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
          <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:4 }}>Transfer Commissioner</div>
          <div style={{ fontSize:12,color:"#6a6a8a",marginBottom:10,lineHeight:1.4 }}>
            Hand off commissioner powers to a team owner. When they next log in, they'll have full control of this league.
          </div>
          <select onChange={e=>{
            if(!e.target.value) return;
            const team = (league.teams||[]).find(t=>t.id===e.target.value);
            if(team && confirm(`Transfer commissioner to ${team.owner}? They will gain full control of this league.`)) {
              onUpdate({...league, commissionerTeamId: team.id, commissionerName: team.owner});
            }
            e.target.value = "";
          }} style={{
            width:"100%",padding:"8px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",
            borderRadius:6,color:"#e8e8f0",fontSize:13,fontFamily:"'Outfit',sans-serif",
          }}>
            <option value="">— Select new commissioner —</option>
            {(league.teams||[]).map(t => (
              <option key={t.id} value={t.id}>{t.owner} ({t.name})</option>
            ))}
          </select>
          {league.commissionerName && <div style={{ marginTop:8,fontSize:11,color:"#4ecdc4" }}>Current commissioner: {league.commissionerName}</div>}
        </div>
      )}

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
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MODALS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AddContestantModal({ open, onClose, league, onUpdate, editing }) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");

  useEffect(() => {
    if (editing) { setName(editing.name||""); setBio(editing.bio||""); setGender(editing.gender||""); }
    else { setName(""); setBio(""); setGender(""); }
  }, [editing, open]);

  function handleSave() {
    if (!name.trim()) return;
    const contestant = { id: editing?.id || generateId(), name: name.trim(), bio: bio.trim(), gender: gender.trim(), status: editing?.status || "active" };
    if (editing) onUpdate({ ...league, contestants: league.contestants.map(c=>c.id===editing.id?contestant:c) });
    else onUpdate({ ...league, contestants: [...(league.contestants||[]), contestant] });
    onClose();
  }
  function handleDelete() {
    if (!editing || !confirm("Delete contestant?")) return;
    onUpdate({ ...league, contestants: league.contestants.filter(c=>c.id!==editing.id) });
    onClose();
  }

  const showGender = league.format === "standard" && league.standardConfig?.genderedDraft;

  return (
    <Modal open={open} onClose={onClose} title={editing?"Edit Contestant":"Add Contestant"}>
      <Input label="Name" placeholder="e.g. Buddha Lo" value={name} onChange={e=>setName(e.target.value)} />
      <Input label="Bio / Description" placeholder="e.g. Executive Chef from Sydney" value={bio} onChange={e=>setBio(e.target.value)} />
      {showGender && <Input label="Gender Category" placeholder="e.g. Male, Female" value={gender} onChange={e=>setGender(e.target.value)} />}
      <div style={{ display:"flex",gap:8,marginTop:16 }}>
        {editing && <Btn variant="danger" onClick={handleDelete}><Icon name="trash" size={14}/> Delete</Btn>}
        <div style={{ flex:1 }}/>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={handleSave} disabled={!name.trim()}>{editing?"Save":"Add"}</Btn>
      </div>
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
export default function FantasyRealityTV() {
  const [leagues, setLeagues] = useState([]);
  const [view, setView] = useState("loading"); // loading | login | home | league | create
  const [selectedId, setSelectedId] = useState(null);
  const [authUser, setAuthUser] = useState(null); // Firebase Auth user object
  const [userProfile, setUserProfile] = useState(null); // {displayName, activations: {leagueId: teamId}}
  const [authLoading, setAuthLoading] = useState(true);
  const [announcement, setAnnouncement] = useState("");

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
        // Load site announcement
        try { const ann = await loadData("site_announcement", ""); setAnnouncement(ann || ""); } catch {}
        setView("home");
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

  async function handleJoinViaCode(inviteCode) {
    if (!authUser || !userProfile) return "Not logged in.";
    const freshLeagues = await refreshLeagues();
    for (const league of freshLeagues) {
      const codes = league.inviteCodes || {};
      const used = league.usedCodes || [];
      const teamId = Object.entries(codes).find(([tid, c]) => c === inviteCode)?.[0];
      if (teamId) {
        if (used.includes(inviteCode)) return "This code has already been used.";
        // Update user profile with activation
        const updatedProfile = {
          ...userProfile,
          activations: { ...(userProfile.activations || {}), [league.id]: teamId }
        };
        await saveUserProfile(authUser.uid, updatedProfile);
        setUserProfile(updatedProfile);
        // Mark code as used
        const updatedLeague = { ...league, usedCodes: [...used, inviteCode] };
        const updatedLeagues = freshLeagues.map(l => l.id === league.id ? updatedLeague : l);
        await persist(updatedLeagues);
        return null;
      }
    }
    return "Invalid invite code.";
  }

  async function resetToImported() {
    if (!confirm("Reset everything to the original imported data? Any changes you've made will be lost.")) return;
    await clearAllStorage();
    const fresh = JSON.parse(JSON.stringify(IMPORTED_LEAGUES));
    await saveAllLeagues(fresh);
    setLeagues(fresh);
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
      pins: {},
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

  const selected = leagues.find(l => l.id === selectedId);
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
    <div style={{ minHeight:"100vh",background:"#0d0d1a",fontFamily:"'Outfit',sans-serif",maxWidth:720,margin:"0 auto",padding:"0" }}>
      <style>{`
        body { margin:0; background:#0d0d1a; }
        input:focus,select:focus{border-color:#e94560!important;outline:none}
        select{background-color:#0d0d18!important;color:#e8e8f0!important}
        option{background:#0d0d18!important;color:#e8e8f0!important}
        optgroup{background:#1a1a30!important;color:#8888aa!important;font-style:normal}
        @media (min-width: 768px) {
          body { padding: 20px; }
          .app-root { max-width: 720px; margin: 0 auto; }
        }
        @media (min-width: 1024px) {
          .app-root { max-width: 900px; }
        }
      `}</style>
      {view==="login" && <AuthScreen onJoinViaCode={handleJoinViaCode} onOpenFAQ={()=>setView("faq")} />}
      {view==="faq" && <FAQPage onBack={()=>setView(authUser?"home":"login")} />}
      {view==="admin" && isAdmin && <AdminPanel leagues={leagues} onBack={()=>setView("home")} onUpdate={persist} />}
      {view==="home" && authUser && <AppHome
        user={authUser} profile={userProfile} leagues={visibleLeagues}
        isAdmin={isAdmin} onSelectLeague={id=>{setSelectedId(id);setView("league")}}
        onCreateLeague={()=>setView("create")} onDeleteLeague={deleteLeague} onDuplicateLeague={duplicateLeague}
        onLogout={handleLogout}
        onJoinViaCode={handleJoinViaCode}
        onOpenAdmin={()=>setView("admin")}
        onOpenFAQ={()=>setView("faq")}
        announcement={announcement}
        allLeaguesCount={leagues.filter(l => l.commissionerUid === authUser?.uid).length} />}
      {view==="create" && <CreateLeagueScreen commissionerUid={authUser?.uid} onSave={async l=>{ await persist([...leagues,l]); setSelectedId(l.id);setView("league"); }} onCancel={()=>setView("home")} />}
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
          persist(updated);
        }}
        onBack={()=>{refreshLeagues();setView("home")}} onReset={resetToImported}
        loggedInTeamId={(isAdmin || selected?.commissionerUid === authUser?.uid) ? (selected.adminTeamId || myTeamIn(selected.id)) : myTeamIn(selected.id)}
        isCommissioner={isAdmin || selected?.commissionerUid === authUser?.uid || (selected?.commissionerTeamId && userProfile?.activations?.[selected.id] === selected.commissionerTeamId)}
        skipLogin={true} />}
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
function AdminPanel({ leagues, onBack, onUpdate }) {
  const [tab, setTab] = useState("stats");
  const [users, setUsers] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [savedAnnouncement, setSavedAnnouncement] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const profiles = await loadAllUserProfiles();
        setUsers(profiles);
        const ann = await loadData("site_announcement", "");
        setAnnouncement(ann || "");
        setSavedAnnouncement(ann || "");
      } catch {}
    })();
  }, []);

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

  const tabs = [{id:"stats",label:"Stats"},{id:"users",label:"Users"},{id:"leagues",label:"Leagues"},{id:"announce",label:"Announce"},{id:"manage",label:"Manage"},{id:"audit",label:"Audit Log"}];

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
              {label:"Total Users",value:totalUsers,color:"#4ecdc4"},
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
        </div>
      )}

      {/* Users Tab */}
      {tab==="users" && (
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

      {/* Leagues Tab */}
      {tab==="leagues" && (
        <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
          {leagues.map(league => (
            <div key={league.id} style={{ padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0" }}>{league.name}</div>
                  <div style={{ fontSize:11,color:"#6a6a8a",marginTop:2 }}>
                    {league.seasonName} · {league.format} · {(league.teams||[]).length} teams · {(league.contestants||[]).length} contestants · Wk {league.currentWeek||1}
                  </div>
                  <div style={{ fontSize:10,color:"#4a4a6a",marginTop:2 }}>
                    {Object.keys(league.weeklyScores||{}).length} weeks scored
                    {league.linkedLeagueId && <span style={{ color:"#4ecdc4",marginLeft:8 }}>Linked</span>}
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
        </div>
      )}

      {/* Announcement Tab */}
      {tab==="announce" && (
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
                entries.push({ time: l.createdAt + Number(w)*86400000, type: "scoring", desc: `Week ${w} scored`, league: l.name });
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

      {/* Manage Tab */}
      {tab==="manage" && (
        <div>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:8 }}>Admin Emails</div>
            <div style={{ fontSize:12,color:"#6a6a8a",marginBottom:10,lineHeight:1.4 }}>
              These emails have full admin access to the platform. The primary admin cannot be removed.
            </div>
            <div style={{ padding:"10px 14px",background:"#12121f",borderRadius:8,border:"1px solid #1e1e38",marginBottom:8 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
                <span style={{ fontSize:13,color:"#e8e8f0" }}>scottwpii@gmail.com</span>
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
              { id: "new_formats", label: "New Formats (Survivor Pool, Elimination Pool, Predictions, Salary Cap)", default: true },
              { id: "h2h", label: "Head-to-Head Matchups Setting", default: true },
              { id: "best_ball", label: "Best Ball Setting", default: true },
              { id: "roto", label: "Categories/Roto Scoring", default: true },
            ].map(flag => (
              <label key={flag.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#12121f",borderRadius:8,border:"1px solid #1e1e38",marginBottom:6,cursor:"pointer" }}>
                <input type="checkbox" defaultChecked={flag.default} style={{ accentColor:"#4ecdc4",width:16,height:16 }} />
                <span style={{ fontSize:12,color:"#e8e8f0" }}>{flag.label}</span>
              </label>
            ))}
          </div>

          <div>
            <div style={{ fontSize:14,fontWeight:700,color:"#e8e8f0",marginBottom:8 }}>Platform Info</div>
            <div style={{ display:"flex",flexDirection:"column",gap:4,fontSize:12,color:"#6a6a8a" }}>
              <div>Version: v1.8.0.0</div>
              <div>Stack: Vite + React + Firebase</div>
              <div>Hosting: Netlify (auto-deploy from GitHub)</div>
              <div>Database: Firebase Realtime Database</div>
              <div>Auth: Firebase Authentication (Email + Google)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTH SCREEN (Login / Sign Up / Join via Code)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AuthScreen({ onJoinViaCode, onOpenFAQ }) {
  const [mode, setMode] = useState("login"); // login | signup | invite | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
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
    } catch (e) {
      setError(e.code === "auth/email-already-in-use" ? "An account with this email already exists. Try logging in." :
               e.code === "auth/weak-password" ? "Password must be at least 6 characters." :
               e.code === "auth/invalid-email" ? "Invalid email address." :
               e.message);
    }
    setBusy(false);
  }

  async function handleSignupAndJoin() {
    if (!email.trim() || !password || !displayName.trim()) { setError("Fill in all fields."); return; }
    if (inviteCode.length < 6) { setError("Enter a 6-character invite code."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setBusy(true); setError("");
    try {
      await signUp(email.trim(), password, displayName.trim());
      // After signup, Firebase auth state changes which triggers onAuthChange,
      // but we need to wait for the profile to be created before joining
      // The join will happen after they land on home screen
      // Store the code to use after login
      localStorage.setItem("frtv_pending_invite", inviteCode);
    } catch (e) {
      if (e.code === "auth/email-already-in-use") {
        // Try logging in instead
        try {
          await signIn(email.trim(), password);
          localStorage.setItem("frtv_pending_invite", inviteCode);
        } catch (e2) {
          setError("Account exists but password is wrong. Try logging in first.");
        }
      } else {
        setError(e.message);
      }
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
        {/* Mode tabs */}
        <div style={{ display:"flex",gap:6,marginBottom:20 }}>
          {[{id:"login",label:"Log In"},{id:"signup",label:"Sign Up"},{id:"invite",label:"Join League"}].map(t=>(
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

        {/* Join League (signup + invite code) */}
        {mode === "invite" && (
          <div>
            <div style={{ padding:"10px 14px",background:"#4ecdc411",borderRadius:8,border:"1px solid #4ecdc433",marginBottom:16 }}>
              <div style={{ fontSize:12,color:"#4ecdc4",lineHeight:1.5 }}>Enter your invite code and create an account (or log in if you already have one).</div>
            </div>
            <input placeholder="Invite code" value={inviteCode} maxLength={6}
              onChange={e=>setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))}
              style={{ ...inputStyle, fontSize:20,textAlign:"center",letterSpacing:"0.2em",fontFamily:"monospace" }} />
            <input type="text" placeholder="Display name" value={displayName} onChange={e=>setDisplayName(e.target.value)} style={inputStyle} />
            <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} style={inputStyle} />
            <input type="password" placeholder="Password (6+ characters)" value={password} onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter")handleSignupAndJoin()}} style={inputStyle} />
            {error && <div style={{ color:"#e94560",fontSize:12,marginBottom:10 }}>{error}</div>}
            <button onClick={handleSignupAndJoin} disabled={busy||inviteCode.length<6} style={{
              width:"100%",padding:"12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:14,fontWeight:700,
              background:"linear-gradient(135deg,#4ecdc4,#2a9d8f)",color:"#fff",fontFamily:"'Outfit',sans-serif",
              opacity:(busy||inviteCode.length<6)?0.5:1,
            }}>{busy ? "..." : "Join League"}</button>
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

        <div style={{ textAlign:"center",marginTop:20,paddingTop:16,borderTop:"1px solid #1e1e38" }}>
          <button onClick={onOpenFAQ} style={{ background:"none",border:"none",color:"#6a6a8a",cursor:"pointer",
            fontSize:12,fontFamily:"'Outfit',sans-serif" }}>How does this work? <span style={{color:"#e94560"}}>Read the FAQ</span></button>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// APP HOME
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function AppHome({ user, profile, leagues, isAdmin, onSelectLeague, onCreateLeague, onDeleteLeague, onDuplicateLeague, onLogout, onJoinViaCode, onOpenAdmin, onOpenFAQ, allLeaguesCount, announcement }) {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  // Check for pending invite code (from join-league signup flow)
  useEffect(() => {
    const pending = localStorage.getItem("frtv_pending_invite");
    if (pending) {
      localStorage.removeItem("frtv_pending_invite");
      (async () => {
        const err = await onJoinViaCode(pending);
        if (err) setError(err);
      })();
    }
  }, []);

  async function handleJoin() {
    if (inviteCode.length < 6) return;
    const err = await onJoinViaCode(inviteCode);
    if (err) setError(err);
    else { setInviteCode(""); setError(""); }
  }

  const displayName = profile?.displayName || user?.displayName || user?.email?.split("@")[0] || "User";

  return (
    <div>
      <div style={{ padding:"20px 20px 10px",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
        <div>
          <div style={{ fontSize:12,color:"#6a6a8a" }}>Welcome back,</div>
          <div style={{ fontSize:18,fontWeight:800,fontFamily:"'Anybody',sans-serif",color:"#e8e8f0" }}>
            {displayName} {isAdmin && <span style={{ fontSize:12,color:"#f5a623" }}>★ Admin</span>}
          </div>
        </div>
        <div style={{ display:"flex",gap:8,alignItems:"center" }}>
          {isAdmin && <button onClick={onOpenAdmin} style={{ background:"none",border:"1px solid #2a2a4a",borderRadius:6,padding:"6px 12px",
            color:"#f5a623",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontWeight:600 }}>Admin</button>}
          <button onClick={onOpenFAQ} style={{ background:"none",border:"1px solid #2a2a4a",borderRadius:6,padding:"6px 12px",
            color:"#6a6a8a",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>FAQ</button>
          <button onClick={onLogout} style={{ background:"none",border:"1px solid #2a2a4a",borderRadius:6,padding:"6px 12px",
            color:"#6a6a8a",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif" }}>Log Out</button>
        </div>
      </div>

      {announcement && (
        <div style={{ margin:"0 20px 0",padding:"10px 14px",background:"#f5a62315",borderRadius:10,border:"1px solid #f5a62333" }}>
          <div style={{ fontSize:13,color:"#f5a623",lineHeight:1.5 }}>{announcement}</div>
        </div>
      )}
      <div style={{ padding:"10px 20px 20px" }}>
        {/* Join a league */}
        <div style={{ marginBottom:20,padding:"12px 14px",background:"#12121f",borderRadius:10,border:"1px solid #1e1e38" }}>
          <div style={{ fontSize:12,fontWeight:600,color:"#8888aa",marginBottom:6 }}>Join a League</div>
          <div style={{ display:"flex",gap:6 }}>
            <input value={inviteCode} onChange={e=>setInviteCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))}
              placeholder="Invite code" maxLength={6} onKeyDown={e=>{if(e.key==="Enter")handleJoin()}}
              style={{ flex:1,padding:"8px 12px",background:"#0d0d18",border:"1px solid #2a2a4a",borderRadius:6,
                color:"#e8e8f0",fontSize:16,fontFamily:"monospace",letterSpacing:"0.15em",textAlign:"center" }} />
            <Btn small onClick={handleJoin} disabled={inviteCode.length<6}>Join</Btn>
          </div>
          {error && <div style={{ color:"#e94560",fontSize:11,marginTop:6 }}>{error}</div>}
        </div>

        {/* League list */}
        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
          <h3 style={{ margin:0,fontFamily:"'Anybody',sans-serif",fontWeight:800,fontSize:18,color:"#f0f0f5",letterSpacing:"-0.02em" }}>My Leagues</h3>
          {(isAdmin || (allLeaguesCount || 0) < 3) && <Btn small onClick={onCreateLeague}><Icon name="plus" size={12}/> New League</Btn>}
        </div>

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
                      <div style={{ color:"#6a6a8a",fontSize:12,marginTop:2 }}>{league.seasonName} · Wk {league.currentWeek||1} · {(league.teams||[]).length} team{(league.teams||[]).length!==1?"s":""}{league.commissionerUid === user?.uid && !isAdmin ? " · Commissioner" : ""}</div>
                      {myTeam && (()=>{
                        const standings = calcStandings(league);
                        const myRank = standings.findIndex(t=>t.id===myTeam.id) + 1;
                        const myPts = standings.find(t=>t.id===myTeam.id)?.total || 0;
                        return myRank > 0 ? (
                          <div style={{ fontSize:11,color:myRank<=3?"#f5a623":"#6a6a8a",marginTop:2 }}>
                            {myRank===1?"🥇":myRank===2?"🥈":myRank===3?"🥉":"#"+myRank} · {myPts>0?"+":""}{myPts} pts
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

