/**
 * Some PoC Apps Script functions that do stuff with data in a table
 * inside a Coda document using automations triggered by Coda webhooks.
 * Test Doc: https://coda.io/d/_ddHZiRsJNFq/Webhooks_sufNH
 *
 * @pfelipm (01/06/22)
 * 
 * @OnlyCurrentDoc
 */


// -------------------------------------
// COMMON CONSTANTS AND HELPER FUNCTIONS
// -------------------------------------

const HEADING_ROW = 2;
const DATA_COLUMNS = 4;
const STATUS = 'A1';
const FILTER = 'F2';
const AUTH = {
  token: 'ce538f15-6275-48a4-8392-a6ed42dfb4b8',
  endpoint: {
    codaAddRows: 'https://coda.io/apis/v1/docs/dHZiRsJNFq/hooks/automation/grid-auto-N3uNWXEE2O',
    codaEmptyTable: 'https://coda.io/apis/v1/docs/dHZiRsJNFq/hooks/automation/grid-auto-J_w8aWbFaM',
    codaFilterTable: 'https://coda.io/apis/v1/docs/dHZiRsJNFq/hooks/automation/grid-auto-8K891Ouklf',
    codaAddRowsMultipleJson: 'https://coda.io/apis/v1/docs/dHZiRsJNFq/hooks/automation/grid-auto-W7trGjZqKg',
    codaAddRowsMultipleJsonArray: 'https://coda.io/apis/v1/docs/dHZiRsJNFq/hooks/automation/grid-auto-x9875DrYnv',
    codaAddModifyRowsMultipleArray: 'https://coda.io/apis/v1/docs/dHZiRsJNFq/hooks/automation/grid-auto-M2m34OgpOq',
    codaDeleteSelectedRows: 'https://coda.io/apis/v1/docs/dHZiRsJNFq/hooks/automation/grid-auto-gMrI9G_5Pg',
    // One endpoint to rule them all!
    codaMultiPurpose: 'https://coda.io/apis/v1/docs/dHZiRsJNFq/hooks/automation/grid-auto-Opug6an_fo'
  }
}

/**
 * Transforms a data interval, with headings, into an object
 * with a property named after the index of each row and a
 * global numElements (rows in the data interval) property
 * @param   {Array[]} data 2D array with heading labels
 * @return  {Object}
 * 
 * Sample input:
 * |"A" | "B" | "C"]
 * | 1  |  2  |  3 |
 * | 4  |  5  |  6 |
 *
 * Sample output:
 * {
 *    numElements: 2,
 *    { "1": { "A": 1, "B": 2, "C": 3} },
 *    { "2": { "A": 4, "B": 5, "C": 6} },
 * }
 * 
 * NOT CURRENTLY IN USE
 */
function table2IndexedObject(data) {

  const [heading, ...rows] = data;
  const object = rows.reduce((obj, row, rowIndex) => {
    obj[rowIndex + 1] = row.reduce((obj, field, colIndex) => {
      obj[heading[colIndex]] = field;
      return obj;
    }, {});
    return obj;
  }, {});
  object.numElements = rows.length;
  return object;

}

/**
 * Transforms a data interval, with headings, into a JSON-like object
 * with a global numElements (rows in the data interval) property
 * @param   {Array[]} data 2D array with heading labels
 * @return  {Object}
 * 
 * Sample input:
 * |"A" | "B" | "C"]
 * | 1  |  2  |  3 |
 * | 4  |  5  |  6 |
 *
 * Sample output:
 * {
 *    numElements: 2, 
 *    rows: [
 *      { "A": 1, "B": 2, "C": 3},
 *      { "A": 4, "B": 5, "C": 6}
 *    ]  
 * }
 */
function table2ArrayObject(data) {

  const [heading, ...rows] = data;
  const arrayJson = rows.map(row => {
    return row.reduce((obj, field, colIndex) => {
      obj[heading[colIndex]] = field;
      return obj;
    }, {});
  }, {});
  
  return { numElements: arrayJson.length, rows: arrayJson };

}