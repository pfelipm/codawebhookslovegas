// -------------------------------------------------------------
// V2 FUNCTIONS, A SINGLE, BIG, MULTI-PURPOSE AUTOMATION IS USED
// -------------------------------------------------------------


// Commands
const COMMAND = {
  empyTable: 'DELETE_ALL_ROWS',
  filterTable: 'SET_FILTER_CONTROL',
  sendData: 'ADD_ROWS',
  sendUpdateData: 'ADD_UPDATE_ROWS',
  deleteSelected: 'DELETE_SELECTED_ROWS'
};

/**
 * Wrapper clients
 */
const clientCodaEmptyTable = () =>  codaWebHook(COMMAND.empyTable);
const clientCodaFilterTable = () => codaWebHook(COMMAND.filterTable);
const clientCodaSendData = () => codaWebHook(COMMAND.sendData);
const clientCodaSendUpdateData = () => codaWebHook(COMMAND.sendUpdateData);
const clientCodaDeleteSelected = () => codaWebHook(COMMAND.deleteSelected);

/**
 * Proxy function for all things Coda, here!
 * @param {string} command
 */
function codaWebHook(command) {

  /**
   * UrlFetch() wrapper function, adds action parameter to JSON payload
   * and returns fetch result code.
   * @param {string} command    Requested action
   * @param {Object} [payload]  POST payload as a JS object
   * @return {number} 
   */
  function pingCodaEndpoint(command, payload) {
    return UrlFetchApp.fetch(
      AUTH.endpoint.codaMultiPurpose,
      {
        method: 'post',
        headers: { Authorization: `Bearer ${AUTH.token}` },
        contentType: 'application/json',
        payload: JSON.stringify({ action: command, ...payload }),
        muteHttpExceptions: true
      }
    ).getResponseCode();
  }

  if(Object.values(COMMAND).includes(command)) {

    // Clears status cell
    const ss = SpreadsheetApp.getActiveSheet();
    ss.getRange(STATUS).clearContent();
    let responseCode, data;

    switch (command) {

      // 1️⃣ Deletes all rows in a Coda table
      case COMMAND.empyTable:
        responseCode = pingCodaEndpoint(command);
        break;

      // 2️⃣ Sets filter user control affecting a Coda table
      case COMMAND.filterTable:
        const rank = ss.getRange(FILTER).getValue();
        responseCode = pingCodaEndpoint(command, { rank: !rank ? 'A+,A,B,C,D,E' : rank });
        break;

      // 3️⃣ Adds rows to a Coda table, can cause duplicates on Coda's side
      case COMMAND.sendData:
        data = ss.getRange(HEADING_ROW, 1, ss.getLastRow() - HEADING_ROW + 1, DATA_COLUMNS).getValues();
        responseCode = pingCodaEndpoint(command, { data: table2ArrayObject(data) })
        break;

      // 4️⃣ Adds or updates rows in a Coda table, name field is used to match villains
      case COMMAND.sendUpdateData:
        data = ss.getRange(HEADING_ROW, 1, ss.getLastRow() - HEADING_ROW + 1, DATA_COLUMNS).getValues();
        responseCode = pingCodaEndpoint(command, { data: table2ArrayObject(data) });
        break;

      // 5️⃣ Deletes selected rows in a Coda table, name of villain field is used to target rows to be removed
      case COMMAND.deleteSelected:
        const selectedRanges = ss.getActiveRangeList();      
        // Gets selected rows, supports partial selections
        if (selectedRanges) {
          const selectedRows = new Set();
          selectedRanges.getRanges().forEach(range => {
            const rangeFirstRow = range.getRowIndex();
            const rangeLastRow = rangeFirstRow + range.getNumRows() - 1;
            let row = rangeFirstRow;
            while (row <= rangeLastRow && row <= ss.getLastRow()) {
              if(row > HEADING_ROW) selectedRows.add(row - HEADING_ROW - 1);
              row++;
            }
          });
          // Pings Coda endpoint if some rows have been selected
          if (selectedRows.size > 0) {            
            const [heading, ...rows] = ss.getRange(HEADING_ROW, 1, ss.getLastRow() + HEADING_ROW - 1, DATA_COLUMNS).getValues();
            const data = [heading,...rows.filter((_, rowIndex) => selectedRows.has(rowIndex))];
            responseCode = pingCodaEndpoint(command, { data: table2ArrayObject(data) });
          }
        }
        break;

    } // end of command processing [SWITCH]
    
    // Sets status cell
    ss.getRange(STATUS).setValue(
    responseCode != 202 ?
      '🟠' :
      '🟢'
    );
  
  } // end of valid command check [IF]

}