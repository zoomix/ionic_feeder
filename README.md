Ionic Feeder
=====================

##An app to help out with breastfeeding.

##TODO:

* Throw up some toasters when syncing.
* Feeding duration in minutes
* Time between feedings
* Decide how many feedings to sync (what time period)
* Only scroll the list, not the buttons
* Style a bit.
* Vibrate on 5 minute mark.
* Modify old feeding.
* Use a better ID
* Update counter in notifications.
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


##Used plugins

    cordova plugin add org.apache.cordova.dialogs
    cordova plugin add https://github.com/EddyVerbruggen/Toast-PhoneGap-Plugin.git

