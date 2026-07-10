// Where the app checks for a newer version on startup.
//
// Point this at a small JSON file that you update each time you release a new
// installer (see latest.json.example for the format). It can be either:
//   - an HTTPS URL   e.g. 'https://intranet.weberflooring.com/rfms/latest.json'
//   - a file / UNC network share path
//                    e.g. '\\\\fileserver\\apps\\RFMS Attachment Bridge\\latest.json'
//
// Put the JSON file next to the installer wherever you distribute it, so the
// two stay in sync. Leave this blank ('') to disable update checks entirely.
export const UPDATE_MANIFEST_URL = ''
