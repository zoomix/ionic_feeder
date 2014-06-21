Ionic Feeder
=====================

##An app to help out with breastfeeding.

##TODO:

* Modify old feeding.
* Create a demo-mode that temporarily changes user id
* Refactor .getNewFeedings to use only startTime
* Use a better ID
* Update counter in notifications.
* Split up controllers
* Sanitize models.js
* Move resync to model and have it throw events
* Make loading of slides dynamic instead of hardcoded (bug in ionic, see weird_auto_slides_bug branch)
* Rename the database. Demo? Really?
* ...

##BUGS:
* Are timezones going to be a real problem in using timestamps? Cross device?

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
