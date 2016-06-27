/**
 * Group
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var _ = require('lodash');

module.exports = {

  identity: 'group',
  connection: 'default',

	attributes: {

		name: {
			type: 'string',
			defaultsTo: '[New Group]',
		},

		// Calculate table scores
       /*
        * Method responsable for computing table data score
        * (method inserted inside group model)
        *
        */

		table: function(){
            // Compute team Wins, Losts, Draws and Goal-Sum
            /*
                // Uses the key as the teamId
                {
                         1: {P: x, S: y, [...]},
                    teamId: {P: x, S: y, [...]}
                 }
            */
            var rawTable = {};
            var _default = {rank: 0, teamId: 0, P: 0, goalsMade: 0, goalsTaken: 0, S: 0, W: 0, D: 0, L: 0, score: 0};

            for(var k in this.matches){
                var match = this.matches[k];

                // Compute game points for both teams
                computeGame(match, match.teamAId, match.teamAScore, match.teamBScore);
                computeGame(match, match.teamBId, match.teamBScore, match.teamAScore);
            }

            // Adds game to the teamId. Should be runned twice for each
            // side of match (teamA and teamB).
            function computeGame(match, teamId, goalsMade, goalsTaken){
                // Skip empty id's
                if(!teamId)
                    return;

                // Generate default template if NOT in array yet
                if(!rawTable[teamId]){
                    var teamRow = _.clone(_default);
                    // Keeps team id under team
                    teamRow.teamId = teamId;
                    // Inserts team in rawTable
                    rawTable[teamId] = teamRow;
                }

                // Get teamRow (it is supposed to exist)
                var teamRow = rawTable[teamId];

                // Compute points ONLY if match is not 'scheduled'
                // logycaly, it's 'ended' or 'playing', so we compute it
                if(match.state == 'scheduled')
                    return;

                // Increment Plays
                teamRow.P++;

                // Compute goals made/taken
                teamRow.goalsMade += goalsMade*1;
                teamRow.goalsTaken += goalsTaken*1;

                // Win
                if(goalsMade > goalsTaken)
                    teamRow.W ++;
                // Loose
                else if(goalsMade < goalsTaken)
                    teamRow.L ++;
                // Drew
                else
                    teamRow.D ++;
            }

            // Compute 'final score' and add column S (goalsMade:goalsTaken)
            // Transfer data to final table array
            var finalTable = [];
            _.forEach(rawTable, function(row){
                row.score = row.W*3 + row.D*1;
                row.S = row.goalsMade*1 + ':' + row.goalsTaken*1;
                row.GD = row.goalsMade*1 - row.goalsTaken*1;

                finalTable.push(row);
            });

            // Sort by 'score' field
            finalTable = _.sortBy(finalTable, 'score').reverse();

            // Rank Table
            var pos = 0;
            var lastScore = -1;

            _.forEach(finalTable, function(row){
                // Keeps the same ranking if scores is the same
                if(lastScore != row.score){
                    pos++;
                    lastScore = row.score;
                }

                row.rank = pos;
            });


            return finalTable;


        }
	},
};
