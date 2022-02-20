let db;

// establishes a connection to IndexedDB database and sets it to version 1
const request = indexedDB.open('budget', 1);

// this event listener will emit if the database version changes
request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;
  // create and object store called 'new_submission' with an auto incrementing key
  db.createObjectStore('new_submission', { autoIncrement: true });
};

request.onsuccess = function (event) {
  // when db is successfully created, or connection is established, save reference to db in global variable
  db = event.target.result;

  //check if app is online, if yes we run uploadSubmission function to send local db data to api
  if (navigator.onLine) {
      uploadSubmission()
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new submission and there's no internet connection
function saveRecord(record) {
  // open a new transaction with the database with read and write permissions
  const transaction = db.transaction(['new_submission'], 'readwrite');

  // access the object store for `new_submission`
  const submissionObjectStore = transaction.objectStore('new_submission');

  // using add metho to add record to store
  submissionObjectStore.add(record);
}

function uploadSubmission() {
  const transaction = db.transaction(['new_submission'], 'readwrite');

  const submissionObjectStore = transaction.objectStore('new_submission');

  const getAll = submissionObjectStore.getAll();

  // upon a successful .getAll() execution, run this function
  getAll.onsuccess = function () {
      // if there was data in indexedDB's store let's send it to the api
    if (getAll.result.length > 0) {
      fetch('/api/transaction', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // access the object store one more time to empty it
          const transaction = db.transaction(['new_submission'], 'readwrite');

          const submissionObjectStore =
            transaction.objectStore('new_submission');
          // clear all items in your store
          submissionObjectStore.clear();

          alert('All saved transactions have been submitted!');
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

window.addEventListener('online', uploadSubmission);