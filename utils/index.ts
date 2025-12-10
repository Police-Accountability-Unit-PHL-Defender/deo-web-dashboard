export const apiBaseUrl = 'https://deo-fastapi.onrender.com'
export const options = { mode: 'cors' }

export function grammaticalJoin(arr: string[], conjunction: string = 'and') {
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return arr.join(` ${conjunction} `);
  return `${arr.slice(0, -1).join(', ')}, ${conjunction} ${arr.slice(-1)}`;
}

export enum QuarterMonths {
  'Jan-Mar' = 1,
  'Apr-Jun' = 2,
  'Jul-Sep' = 3,
  'Oct-Dec' = 4
}

export class Quarter {
  year: number;
  quarter: QuarterMonths;
  constructor(year: number, quarter: QuarterMonths) {
    this.year = year;
    this.quarter = quarter;
  }
  toParamString() {
    return `${this.year}-Q${this.quarter}`;
  }
  toString() {
    return QuarterMonths[this.quarter] + ' ' + this.year;
  }
  getStartString() {
    return QuarterMonths[this.quarter].split('-')[0] + ' ' + this.year;
  }
  getEndString() {
    return QuarterMonths[this.quarter].split('-')[1] + ' ' + this.year;
  }
  getNextQuarter() {
    if (this.quarter === 4) {
      return new Quarter(this.year + 1, 1);
    } else {
      return new Quarter(this.year, this.quarter + 1);
    }
  }
  getPreviousQuarter() {
    if (this.quarter === 1) {
      return new Quarter(this.year - 1, 4);
    } else {
      return new Quarter(this.year, this.quarter - 1);
    }
  }
  static fromParamString(paramString: string) {
    const [year, quarter] = paramString.split('-Q');
    return new Quarter(parseInt(year), parseInt(quarter));
  }
  static isSameQuarter(q1: Quarter, q2: Quarter) {
    return q1.year === q2.year && q1.quarter === q2.quarter;
  }
}

export function getLocationParam(location: string) {
  if (location.startsWith('PSA')) {
    // Hardcode specific case for 77A -> 77-0
    if (location === 'PSA 77A') {
      return '77-0'
    }
    return location.substring(4, 6) + '-' + location.substring(6)
  } else if (location.startsWith('District')) {
    return location.substring(9).padStart(2, '0') + '*'
  } else if (location.startsWith('Division')) {
    return location.substring(9)
  } else {
    return '*'
  }
}

export function getQuarterParam(quarter: QuarterMonths) {
  return `Q${QuarterMonths[quarter]}`
}

export function getEventParam(event: string) {
  if (event==='traffic stops') return 'stop'
  if (event==='searches') return 'search'
  if (event==='frisks') return 'frisk'
  if (event==='intrusions') return 'intrusion'
  return ''
}

export function getDemographicGroupParam(demographicGroup: string) {
  if (demographicGroup === 'age range') return 'Age Range'
  if (demographicGroup === 'gender') return 'Gender'
  if (demographicGroup === 'race') return 'Race'
  return ''
}

export function formatLocationForSentence(locationValue: string, capitalize=false) {
  if (locationValue.startsWith('PSA')) {
    return 'PSA ' + locationValue.substring(4, 6) + '-' + locationValue.substring(6)
  }
  return `${locationValue}`
}

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const policeEvent = {
  n_stopped: {
    verb_past: 'stopped',
    verb_present: 'stop',
    noun: 'stops',
  },
  n_searched: {
    verb_past: 'searched',
    verb_present: 'search',
    noun: 'searches',
  },
  n_arrested: {
    verb_past: 'arrested',
    verb_present: 'arrest',
    noun: 'arrests',
  },
  n_frisked: {
    verb_past: 'frisked',
    verb_present: 'frisk',
    noun: 'frisks',
  },
  n_intruded: {
    verb_past: 'intruded',
    verb_present: 'intrude',
    noun: 'intrusions',
  },
}

export function objectMap(obj: any, fn: any): any {
  return Object.fromEntries(
    Object.entries(obj).map(
      ([k, v], i) => [k, fn(v, k, i)]
    )
)}

export function groupBy(data: any[], key: string) {
  return data.reduce((acc, item) => {
    (acc[item[key]] = acc[item[key]] || []).push(item);
    return acc;
  }, {});
}

export async function getDataFromCSV(source: string) {
  return await fetch(source)
    .then(response => response.text())
    .then(text => {
      const data = CSVToArrayOfObjects(text);
      return data;
    })
    .catch(error => {
      console.error(error);
    });
}

export function CSVToArrayOfObjects(csv: string, delimiter: string = ',' ): any[] {
  const lines = CSVToArray(csv, delimiter);
  const headers = lines.shift();
  if (!headers) throw new Error( 'CSV must have headers' );
  return lines.map(line => {
    const obj = {};
    headers.forEach((header,index) => {
      obj[header] = line[index];
    });
    return obj;
  });
}

// ref: http://stackoverflow.com/a/1293163/2343
// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
export function CSVToArray( strData: string, strDelimiter: string ){
  // Check to see if the delimiter is defined. If not,
  // then default to comma.
  strDelimiter = (strDelimiter || ",");

  // Create a regular expression to parse the CSV values.
  var objPattern = new RegExp(
      (
          // Delimiters.
          "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

          // Quoted fields.
          "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

          // Standard fields.
          "([^\"\\" + strDelimiter + "\\r\\n]*))"
      ),
      "gi"
      );


  // Create an array to hold our data. Give the array
  // a default empty first row.
  var arrData = [[]];

  // Create an array to hold our individual pattern
  // matching groups.
  var arrMatches = null;


  // Keep looping over the regular expression matches
  // until we can no longer find a match.
  while (arrMatches = objPattern.exec( strData )){

      // Get the delimiter that was found.
      var strMatchedDelimiter = arrMatches[ 1 ];

      // Check to see if the given delimiter has a length
      // (is not the start of string) and if it matches
      // field delimiter. If id does not, then we know
      // that this delimiter is a row delimiter.
      if (
          strMatchedDelimiter.length &&
          strMatchedDelimiter !== strDelimiter
          ){

          // Since we have reached a new row of data,
          // add an empty row to our data array.
          arrData.push( [] );

      }

      var strMatchedValue;

      // Now that we have our delimiter out of the way,
      // let's check to see which kind of value we
      // captured (quoted or unquoted).
      if (arrMatches[ 2 ]){

          // We found a quoted value. When we capture
          // this value, unescape any double quotes.
          strMatchedValue = arrMatches[ 2 ].replace(
              new RegExp( "\"\"", "g" ),
              "\""
              );

      } else {

          // We found a non-quoted value.
          strMatchedValue = arrMatches[ 3 ];

      }


      // Now that we have our value string, let's add
      // it to the data array.
      arrData[ arrData.length - 1 ].push( strMatchedValue );
  }

  // Return the parsed data.
  return( arrData );
}