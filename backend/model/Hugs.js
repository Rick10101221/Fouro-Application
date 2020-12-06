// Hugs file for Creating, Reading, Updating, and Deleting Hugs
var firebase = require("../firebase/admin");
const admin = require("firebase-admin");
require("firebase/firestore");
require("firebase/storage");

// import
const Users = require("../model/Users");
const Notifications = require("./Notifications");

// Firestore
const db = firebase.firestore();
const users = db.collection("users");
const hugs = db.collection("hugs");

const HugsAPI = {
  // The user that calls this function is the sender
  // TODO: More error handling and monitor upload progress?
  createHug: async function (currentUser, friendId, message, image) {
    // Set current user
    var currUser = users.doc(currentUser);
    // const currUser = firebase.auth().currentUser;
    // Set the date of the hug (also used to ID image)
    let dateInSeconds = Math.floor(Date.now() / 1000);
    var dateTime = await new admin.firestore.Timestamp(dateInSeconds, 0);
    console.log("dateTime", dateTime);
    // Image: byte array
    // Create a root reference in firebase storage
    var storageRef = await firebase.storage().ref();
    // Create a unique image ID
    var imageName = "hug_images/" + Date().now();
    // Create a reference to the hug image (use when we download?)
    // var hugImageRef = storageRef.child(imageName)
    // Convert the byte array image to Uint8Array
    var bytes = new Uint8Array(image);
    // TODO: not sure if var is needed
    var uploadTask = await storageRef.child(imageName).put(bytes);
    // Save a reference to the top level hug with an autoID (I think)
    var topLevelHug = db.collection("hugs").doc(); //possible problems if we make a doc every time
    // Listen for state changes, errors, and completion of the upload
    uploadTask.on(
      firebase.storage.TaskEvent.STATE_CHANGED,
      function (snapshot) {
        // Get task prograss, including the number of bytes uploaded and the total number of bytes to be uploaded
        var progress = (snapshot.bytesTrasferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
        switch (snapshot.state) {
          case firebase.storage.TaskState.PAUSED:
            console.log("Upload is paused");
            break;
          case firebase.storage.TaskState.RUNNING:
            console.log("Upload is running");
            break;
        }
      },
      function (error) {
        // A full list of error codes is available at
        // https://firebase.google.com/docs/storage/web/handle-errors
        switch (error.code) {
          case "storage/unauthorized":
            // User doesn't have permission to access the object
            break;

          case "storage/canceled":
            // User canceled the upload
            break;

          case "storage/unknown":
            // Unknown error occurred, inspect error.serverResponse
            break;
        }
      },
      function () {
        //Upload completed successfully, now we can get the download URL
        uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
          console.log("File available at", downloadURL);
          // Add fields to the top level "hugs" collection
          // and store the reference
          topLevelHug.set({
            completed: false,
            date_time: dateTime,
            receiver_description: "",
            sender_description: message,
            images: [downloadURL],
            receiver_ref: users.doc(friendId),
            sender_ref: currUser,
          });
        });
      }
    );
    // COMMENTED OUT FOR NEW IMAGE UPLOAD ^^
    // Add fields to the top level "hugs" collection and store the reference
    // Save a reference to the top level hug with an autoID (I think)
    //var topLevelHug = db.collection("user_hugs").doc();
    //topLevelHug.set({
    //    completed: false,
    //    date_time: dateTime,
    //    receiver_description: "",
    //    sender_description: message,
    //    images: [uploadTask],
    //    receiver_id: friendId,
    //    sender_ref: currUser.uid,
    //});
    // Add fields to currUser's hug auto-ID document

    // MAKE SURE THIS HAPPENS AFTER WE MADE THE TOP LEVEL HUG
    await users
      .doc(currUser.id)
      .collection("user_hugs")
      .doc(topLevelHug)
      .set({
        completed: false,
        date_time: dateTime, //dateTime is an actual DateTime object (timestamp?)
        friend_ref: users.doc(friendId),
        hug_ref: topLevelHug, //Use the ref to the top level hug ^^
        pinned: false,
      })
      .then(function (docRef) {
        console.log("Document written with ID: ", docRef.id);
      })
      .catch(function (error) {
        console.error("Error adding document: ", error);
      });
    await friendId
      .collection("user_hugs")
      .doc(topLevelHug)
      .set({
        completed: false,
        date_time: dateTime, //dateTime is an actual DateTime object (timestamp?)
        friend_ref: users.doc(friendId),
        hug_ref: topLevelHug, //Use the ref to the top level hug ^^
        pinned: false,
      })
      .then(function (docRef) {
        console.log("Document written with ID: ", docRef.id);
      })
      .catch(function (error) {
        console.error("Error adding document: ", error);
      });
    // Create a hug request
    Notifications.RequestsAPI.sendHugRequest(currentUser, friendId);
    return { out: true };
  },

  // hugId is the global hug.
  dropHug: function (currentUser, requestId, hugId) {
    // Set current user
    var currUser = users.doc(currentUser);
    // Set ref for top level hug
    var topLevelHug = db.collection("hugs").doc(hugId);
    // delete requestId
    users
      .doc(currUser.id)
      .collection("notifications")
      .doc(requestId)
      .delete()
      .then();
    // delete the sender's user_hug
    users
      .doc(db.collection("hugs").doc(hugId).get("sender_ref").id)
      .delete()
      .then();
    // delete the receiver's user_hug
    users
      .doc(db.collection("hugs").doc(hugId).get("receiver_ref").id)
      .delete()
      .then();
    // Remove hug images from storage

    // TODO: Loop through each element in the images array of hugId
    db.collection("hugs")
      .doc(hugId)
      .get("images")
      .then(function (querySnapshot) {
        querySnapshot.forEach(function (image) {
          // Every time we get another HTTPS URL from images, we need to make an httpsReference
          // Create a reference from a HTTPS URL
          var httpsReference = storage.getReferenceFromURL(image);
          httpsReference.delete().then();
        });
        return results;
      });
    // Delete the global hug document
    topLevelHug.delete().then();
  },
};

const UpdateHugAPI = {
  // currentUser must be the receiver of a hug
  respondToHug: function (currentUser, hugId, message, image) {
    // Set current user
    var currUser = users.doc(currentUser);
    // Process the image
    // Create a root reference
    var storageRef = firebase.storage().ref();
    // Create a unique image ID
    var imageName = "hug_images/" + dateTimeString;
    // Create a reference to the hug image (use when we download?)
    // var hugImageRef = storageRef.child(imageName)
    // Convert the byte array image to Uint8Array
    var bytes = new Uint8Array(image);
    // uploadTask is the ref to the image in GCP?
    var uploadTask = storageRef.child(imageName).put(bytes);
    // Listen for state changes, errors, and completion of the upload
    uploadTask.on(
      firebase.storage.TaskEvent.STATE_CHANGED,
      function (snapshot) {
        // Get task prograss, including the number of bytes uploaded and the total number of bytes to be uploaded
        var progress = (snapshot.bytesTrasferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
        switch (snapshot.state) {
          case firebase.storage.TaskState.PAUSED:
            console.log("Upload is paused");
            break;
          case firebase.storage.TaskState.RUNNING:
            console.log("Upload is running");
            break;
        }
      },
      function (error) {
        // A full list of error codes is available at
        // https://firebase.google.com/docs/storage/web/handle-errors
        switch (error.code) {
          case "storage/unauthorized":
            // User doesn't have permission to access the object
            break;

          case "storage/canceled":
            // User canceled the upload
            break;

          case "storage/unknown":
            // Unknown error occurred, inspect error.serverResponse
            break;
        }
      },
      function () {
        //Upload completed successfully, now we can get the download URL
        uploadTask.snapshot.ref.getDownloadURL().then(function (downloadURL) {
          console.log("File available at", downloadURL);
          hugs.doc(hugId).update({
            completed: true,
            description_receiver: message,
            images: db.FieldValue.arrayUnion(downloadURL),
          });
        });
      }
    );

    // COMMENTED THIS OUT FOR NEW IMAGE UPLOAD ^^
    // hugId is a refernce to the top level hug
    //db.collection("hugs")
    //    .doc(hugId)
    //    .update({
    //        completed: true,
    //        description_receiver: message,
    //        images: db.FieldValue.arrayUnion(uploadTask), //not sure how arrayUnion works
    //    });

    // Call updateUserHugCount()
    this.updateUserHugCount(hugId);
    // call deleteNotification
    // Getting the requestId may be questionable
    currUserNotifRef = db
      .colection("users")
      .doc(currUser.id)
      .collection("notifications");
    requestIdRef = currUserNotifRef.where("hug_id", "==", hugId);
    Notifications.NotificationsAPI.deleteNotification(requestIdRef);
  },

  updateUserHugCount: function (hugId) {
    db.collection("hugs")
      .doc(hugId)
      .get()
      .then(function (doc) {
        if (doc.exists) {
          // Increment receiver and sender hug count
          receiverId = doc.data().receiver_ref.id;
          senderId = doc.data().sender_ref.id;
          Users.UsersAPI.increaseHugCount(receiverId);
          Users.UsersAPI.increaseHugCount(senderId);
          // Update each user's user_hug to completed : true
          users.doc(receiverId).update({
            completed: true,
          });
          users.doc(senderId).update({
            completed: true,
          });
        } else {
          console.log("No such document!");
        }
      })
      .catch(function (error) {
        console.log("Error getting document:", error);
      });
  },

  deleteAllImagesInArray: function (imagesArray) {
    var storage = firebase.storage();
    // Loop through each element in the images array of hugId
    imagesArray.forEach(function (image) {
      // Every time we get another HTTPS URL from images, we need to make an httpsReference
      // Create a reference from a HTTPS URL
      var httpsReference = storage.refFromURL(image);
      httpsReference.delete().then();
    });
  },

  deleteImage: function (imageHttps) {
    var storage = firebase.storage();
    // Create a root reference in firebase storage
    var httpsReference = storage.refFromURL(imageHttps);
    httpsReference.delete().then();
  },

  deleteImageFromPath: function (pathString) {
    storageRef.child(pathString).delete().then();
  },
};

const ViewHugAPI = {
  // TODO: MAKE SURE OUTPUTS STRING JSON
  getHugById: async function (hugId) {
    var fullHugInfo = {};
    // Set the hugData
    const hugQuery = await hugs.doc(hugId).get();
    const hugData = hugQuery.data();
    // Set the receiver profile
    var receiverProfile = await Users.UsersAPI.getUserProfile(
      hugData.receiver_ref.id
    );
    // Set the sender user profile
    var senderProfile = await Users.UsersAPI.getUserProfile(
      hugData.sender_ref.id
    );
    // console.log(hugData);
    if (Object.keys(hugData).length != 0) {
      fullHugInfo.date_time = hugData.date_time.toDate().toString();
      fullHugInfo.images = hugData.images;
      // RECEIVER
      fullHugInfo.receiver_description = hugData.receiver_description;
      fullHugInfo.receiver_name = receiverProfile.name;
      fullHugInfo.receiver_username = receiverProfile.username;
      fullHugInfo.receiver_profile_picture = receiverProfile.profile_pic;
      fullHugInfo.receiver_id = hugData.receiver_ref.id;
      // SENDER
      fullHugInfo.sender_description = hugData.sender_description;
      fullHugInfo.sender_name = senderProfile.name;
      fullHugInfo.sender_username = senderProfile.username;
      fullHugInfo.sender_profile_picture = senderProfile.profile_pic;
      fullHugInfo.sender_id = hugData.sender_ref.id;
    } else {
      console.log("No such document!");
    }
    // console.log(fullHugInfo.sender_description);
    return fullHugInfo;
  },

  // Gets all hugs from the currently logged in user
  // TODO: not sure how to use the paginated data "next"
  // TODO: delete one of the versions. not sure how to return multiple docs?
  getUserHugs: async function (currentUser) {
    // GET ALL VERSION

    var results = [];
    const userHugsQuery = await users
      .doc(currentUser)
      .collection("user_hugs")
      .orderBy("date_time", "desc")
      .where("completed", "==", true)
      .get();
    // Go through each user_hug that is completed
    for (const doc of userHugsQuery.docs) {
      let currHugId = doc.data().hug_ref.id;
      let currHug = await hugs.doc(currHugId).get();
      let currHugData = currHug.data();
      var loadIn = {};
      // Set the name of the person currentUser hugged
      if (users.doc(currentUser).id == currHugData.receiver_ref.id) {
        let friend = await Users.UsersAPI.getUserProfile(
          currHugData.sender_ref.id
        );
        loadIn.friend_name = friend.name;
        loadIn.friend_username = friend.username;
        loadIn.friend_profile_pic = friend.profile_pic;
      } else if (users.doc(currentUser).id == currHugData.sender_ref.id) {
        let friend = await Users.UsersAPI.getUserProfile(
          currHugData.receiver_ref.id
        );
        loadIn.friend_name = friend.name;
        loadIn.friend_username = friend.username;
        loadIn.friend_profile_pic = friend.profile_pic;
      }
      // Set the message to be the SENDER'S message ALWAYS
      loadIn.message = currHugData.sender_description;
      // Set the image to be the first image added
      loadIn.image = currHugData.images[0];
      // Set the hugId
      loadIn.hug_id = currHugId;
      // add the JSON the results array
      results = [...results, loadIn];
    }
    var feed = { userHugs: results };
    return feed;

    // PAGINATED VERSION
    // var first = db
    //     .collection("users")
    //     .doc(currUser.uid)
    //     .collection("user_hugs")
    //     .orderBy("date_time")
    //     .limit(25);
    // return first.get().then(function (documentSnapshots) {
    //     // Get the last visible document
    //     var lastVisible =
    //         documentSnapshots.docs[documentSnapshots.docs.length - 1];
    //     console.log("last", lastVisible);

    //     // Construct a new query starting at this document,
    //     // get the next 25 hugs.
    //     var next = db
    //         .collection("users")
    //         .doc(currUser.uid)
    //         .collection("user_hugs")
    //         .orderBy("date_time")
    //         .limit(25);
    // });
  },

  getSharedHugs: async function (currentUser, targetUser) {
    // GET ALL VERSION

    // Set the hugData
    // const currUser = Users.UsersAPI.getUserProfile(currentUser);
    // const currUserName = currUser.name;
    // const currUserUsername = currUser.username;
    // const currUserProfilePic = currUser.profile_pic;

    var results = [];
    const hugsQuery = await hugs
      .orderBy("date_time", "desc")
      .where("completed", "==", true)
      .get();
    // Go through each user_hug that is completed
    for (const doc of hugsQuery.docs) {
      let currHugData = doc.data();
      var loadIn = {};
      senderId = currHugData.sender_ref.id;
      receiverId = currHugData.receiver_ref.id;
      // adds any hug with both users to the results array
      if (
        (senderId === currentUser && receiverId === targetUser) ||
        (senderId === targetUser && receiverId === currentUser)
      ) {
        // Set the name of the person currentUser hugged
        if (users.doc(currentUser).id == currHugData.receiver_ref.id) {
          let friend = await Users.UsersAPI.getUserProfile(
            currHugData.sender_ref.id
          );
          loadIn.friend_name = friend.name;
          loadIn.friend_username = friend.username;
          loadIn.friend_profile_pic = friend.profile_pic;
        } else if (users.doc(currentUser).id == currHugData.sender_ref.id) {
          let friend = await Users.UsersAPI.getUserProfile(
            currHugData.receiver_ref.id
          );
          loadIn.friend_name = friend.name;
          loadIn.friend_username = friend.username;
          loadIn.friend_profile_pic = friend.profile_pic;
        }
        // Set the message to be the SENDER'S message ALWAYS
        loadIn.message = currHugData.sender_description;
        // Set the image to be the first image added
        loadIn.image = currHugData.images[0];
        // Set the hugId
        loadIn.hug_id = doc.id;
        // add the JSON the results array
        results = [...results, loadIn];
      }
    }
    var feed = { sharedHugs: results };
    return feed;
  },
};

// Export the module
module.exports = { HugsAPI, UpdateHugAPI, ViewHugAPI };
