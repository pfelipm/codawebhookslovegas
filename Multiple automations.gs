// ----------------------------------------------------
// V1 FUNCTIONS, EACH ONE TARGETS A DIFFERENT AUTOMATION
// -----------------------------------------------------


/**
 * Sends all villains to a Coda automation endpoint that
 * adds them to a table, uses multiple asynchronous fetch requests,
 * order is not guaranteed.
 */
function codaSendData() {

  ss = SpreadsheetApp.getActiveSheet();
  ss.getRange(STATUS).clearContent();
  const data = ss.getRange(HEADING_ROW + 1, 1, ss.getLastRow() - HEADING_ROW, 4).getValues();
  const requests = [];
  data.forEach(row => {
    requests.push(
      {
        url: AUTH.endpoint.codaAddRows,
        method: 'post',
        headers: { Authorization: `Bearer ${AUTH.token}` },
        contentType: 'application/json',
        payload: JSON.stringify({
          name: row[0],
          rank: row[1],
          lastFight: row[2],
          won: row[3]
        })
      });
  });
  const resultCodes = UrlFetchApp.fetchAll(requests).map(result => result.getResponseCode());
  ss.getRange(STATUS).setValue(
    resultCodes.some(code => code != 202) ?
      '🟠' :
      '🟢'
  );

}

/**
 * Pings a Coda automation endpoint that deletes all data in a table,
 * no payload inside the POST request is needed.
 */
function codaEmptyTable() {

  const ss = SpreadsheetApp.getActiveSheet();
  ss.getRange(STATUS).clearContent();
  resultCode = UrlFetchApp.fetch(
    AUTH.endpoint.codaEmptyTable,
    {
      method: 'post',
      headers: { Authorization: `Bearer ${AUTH.token}` },
      contentType: 'application/json',
    }
  ).getResponseCode();

  ss.getRange(STATUS).setValue(
    resultCode != 202 ?
      '🟠' :
      '🟢'
  );

}

/**
 * Pings a Coda automation endpoint that sets a user control
 * to apply filter data of a table in a specific way.
 */
function codaFilterTable() {

  ss = SpreadsheetApp.getActiveSheet();
  ss.getRange(STATUS).clearContent();
  const rank = ss.getRange(FILTER).getValue();
  resultCode = UrlFetchApp.fetch(
    AUTH.endpoint.codaFilterTable,
    {
      method: 'post',
      headers: { Authorization: `Bearer ${AUTH.token}` },
      contentType: 'application/json',
      payload: JSON.stringify({ rank: !rank ? 'A+,A,B,C,D,E' : rank })
    }
  ).getResponseCode();

  SpreadsheetApp.getActiveSheet().getRange(STATUS).setValue(
    resultCode != 202 ?
      '🟠' :
      '🟢'
  );

}

/**
 * Pings a Coda automation endpoint that adds or modifies
 * (if name of villain already found in the Coda table) all
 * rows passed inside the JSON payload, order is guaranteed.
 */
function codaSendDataMultiple() {

  const ss = SpreadsheetApp.getActiveSheet();
  ss.getRange(STATUS).clearContent();
  const data = ss.getRange(HEADING_ROW, 1, ss.getLastRow() - HEADING_ROW + 1, 4).getValues();
  resultCode = UrlFetchApp.fetch(
    // AUTH.endpoint.codaAddRowsMultipleJson,
    // AUTH.endpoint.codaAddRowsMultipleJsonArray,
    AUTH.endpoint.codaAddModifyRowsMultipleArray,
    {
      method: 'post',
      headers: { Authorization: `Bearer ${AUTH.token}` },
      contentType: 'application/json',
      // payload: JSON.stringify(table2IndexedObject(data))
      // JSON paths [] start from 0, XPaths from 1: https://goessner.net/articles/JsonPath/index.html#e3
      payload: JSON.stringify({data: table2ArrayObject(data)})

    }
  ).getResponseCode();

  ss.getRange(STATUS).setValue(
    resultCode != 202 ?
      '🟠' :
      '🟢'
  );

}

/**
 * Pings a Coda automation endpoint that deletes all rows
 * passed inside the JSON payload, name of villain field
 * is used to target rows to be deleted.
 */
function codaDeleteSelected() {

  ss = SpreadsheetApp.getActiveSheet();
  const selectedRanges = ss.getActiveRangeList();
  
  if (selectedRanges) {

    let selectedRows = new Set();
    selectedRanges.getRanges().forEach(range => {
      const rangeFirstRow = range.getRowIndex();
      const rangeLastRow = rangeFirstRow + range.getNumRows() - 1;
      let row = rangeFirstRow;
      while (row <= rangeLastRow && row <= ss.getLastRow()) {
        if(row > HEADING_ROW) selectedRows.add(row - HEADING_ROW - 1);
        row++;
      }
    });
    if (selectedRows.size > 0) {
      
      ss.getRange('A1').clearContent();
      const [heading, ...rows] = ss.getRange(HEADING_ROW, 1, ss.getLastRow() + HEADING_ROW - 1, 4).getValues();
      // Include only selected rows, partial selections are supported
      const data = [heading,...rows.filter((_, rowIndex) => selectedRows.has(rowIndex))];
      console.info(data);

      resultCode = UrlFetchApp.fetch(
        AUTH.endpoint.codaDeleteSelectedRows,
        {
          method: 'post',
          headers: { Authorization: `Bearer ${AUTH.token}` },
          contentType: 'application/json',
          // We are passing all fields, even though in this use-case only
          // the name field is used to match villains on the Coda's side.
          payload: JSON.stringify({data: table2ArrayObject(data)})
        }
      ).getResponseCode();

      ss.getRange('A1').setValue(
        resultCode != 202 ?
          '🟠' :
          '🟢'
      );

    }
  }
}