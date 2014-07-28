Ionic Baby Feeder
=====================

##An app to help out with breastfeeding. See http://zoomix.github.io/ionic_feeder/ for more info.

## Tests

    load test/model.html in chrome browser. Preferably in a private window


##TODO:
* Rename the app =)

##BUGS:
* ion-refresher stops updating of timer on samsung s3 running 4.3. =/
* Are timezones going to be a real problem in using timestamps? Cross device? Time syncs?
* When an ongoing feeding is resynced it is marked as updated. Following syncs will reload the list unecessariliy. 

##FUTURE:
* MOTD
* Feedback in background without user having to send email.
* Split up controllers. Extract list controller to save on updating everything on every second
* Sanitize model.js
* Update counter in notifications.
* Share code via nfc. phonegap-nfc
* Refresh button in main view instead of menu?
* Skins for app
* More tests


##DONE:
* Store partials in db.
* Skip fullscreen - show status bar.
* Run in backgrund.
* Re-enter continues timer.
* Rename app
* Store status of row, continues on resume.
* Max feeding time.
* Buttons change content when toggled.
* Time since last feeding
* Sync with the interwebs.
* "Push all" button to sync all current feedings.
* Store syncs
* Merge sync better. Go back. 
* Show off ongoing feedings in sync
* Resuming app after a long sleep doesnt set duration to max time, it just pinches it off
* Resync on resume
* Quit doublesyncing
* Throw up some toasters when syncing.
* Feeding duration in minutes
* Time between feedings
* Style a bit.
* Mark next feeding
* Make a generic menu and move "upload all" button there
* Create user-id on startup if not created.
* Send user id by email
* Input user-id
* Vibrate on 5 minute mark.
* Put a menu button for manual sync of latest day
* Move .hasId to model where it belongs (bug)
* Use button instead of <a> for buttons
* Don't revibrate when reentering app.
* Add menu button
* Refactor .getNewFeedings to use only startTime
* Time since last Feeding works across days.
* Modify old feeding.
* Does a full resync on a day without registered feedings (bug)
* Add updatedAt-field to feedings to sync deletes and modifies.
* Bottle button. No time.
* Clicking bottle button opens slider for volume.
* Edit bottle
* Spinner spins forever on new installations. (bug - fixed a while ago.)
* Sometimes we receive a double click on a button / phantom click. (bug - fixed a while ago.)
* Sometimes a store gets 0 duration even though the timer was on. (bug - fixed a while ago.)
* Scroll box size to small. Can't scroll when there are no times. (bug)
* Show predicted supplier if there's been one used last 24hours.
* Wrong suggested supplier when deleted.
* Did the list become sluggish all of a sudden? Scrolling up and down stutters. (bug)
* Load previous day's data when today is loaded.
* Make loading of slides dynamic instead of hardcoded (bug in ionic, see weird_auto_slides_bug branch ($ionicSlideDelegate.update() fixed it))
* Create a demo-mode that temporarily changes user id
* Rename the database. Demo? Really?
* Use a better ID
* Popup buttons.
* Edit bottle. Use bottle icon instead of 'B'
* Share/enter code -> Connect devices
* Drag down to reload
* Reloading bar instead of spinner.
* Bottle feeding default - 150ml
* Scrolling "time between feedings" gets reset. Use something clever here. (bug)
* Are you sure you want to delete.
* Resyncing doesnt reset previous day. (should clear anything up to that date.) (bug)
* Move resync to model and do callbacks
* Adding a bottle feeding doesnt update time between (bug)
* Range slider messes up when sliding on s3. It looks like it's working and then aligns left and dies. (bug - fixed a while ago)
* Predicted supplier doesnt predict when running with empty params. (bug)
* Tests? Specs?
* Change background on button click to give press feedback.
* Sometimes we get two timers running for the same feeding. (bug. Seems fixed)
* Tactile feedback on clicking the feeding list items
* When entering a new secret code, automatically perform a sync.
* Texts and message for sharing/entering code. 
* Design subject-line in popups.
* Do we need a "start feeding" text between timer and feeding-buttons? Only the first time?
* Step down the update interval when app is sleeping
* Feedback


##Used plugins

    cordova plugin add https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git
    cordova plugin add https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin.git

    cordova plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-vibration.git
    cordova plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-dialogs.git
    cordova plugin rm org.apache.cordova.core.dialogs
    cordova plugin rm org.apache.cordova.core.vibration

##Tried..

    cordova plugin add https://github.com/EddyVerbruggen/LaunchMyApp-PhoneGap-Plugin.git --variable URL_SCHEME=ionicfdr  

but since sharing cannot specify a url the ionicfdr://USER_ID just sits there like regular unclickable text =(. Maybe generate an HTML message and share that instead?
