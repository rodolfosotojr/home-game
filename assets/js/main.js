$(document).ready(function () {
    $("#game-table").hide();
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyDkbKJqpJJowM-2_Mr4Nb2sr04oJegzvG4",
        authDomain: "home-game-project.firebaseapp.com",
        databaseURL: "https://home-game-project.firebaseio.com",
        projectId: "home-game-project",
        storageBucket: "home-game-project.appspot.com",
        messagingSenderId: "257380066637"
    };
    firebase.initializeApp(config);

    var database = firebase.database();

    //Create global variables
    var dateStart;
    var dateEnd;
    var userCity;
    var destCity;
    var date;
    var name;
    var time;
    var league;
    var travelDistance;
    var count = 0;

    //Remember to do input validation
    function gatherData() {
        $(".startDate").on("input", function () {
            dateStart = $(".startDate").val();
        });

        //Remember to do input validation
        $(".endDate").on("input", function () {
            dateEnd = $(".endDate").val();
        });

        $(".originCty").on("input", function () {
            userCity = $(".originCty").val().trim();
        });

        $(".endCty").on("input", function () {
            destCity = $(".endCty").val().trim();
        });
    };

    // *************** START USER DATA AQUISITION ***************
    // Remember to do input validation - Eric

    gatherData();

    $(".submit-btn").on("click", function (event) {
        event.preventDefault();
        $("#game-table").show();
        gatherData();
        getTicketmaster(dateStart, dateEnd, userCity, destCity);
        getMapsInfo(userCity, destCity);

        //keep origing city as previously selected and clear out city destination box
        $(".originCty").val(userCity);
        $(".endCty").val("");
    });

    // *************** END USER DATA AQUISITION ***************      

    // *************** START TICKETMASTER QUERY ***************

    function getTicketmaster(startDate, endDate, origin, destination) {
        var idNBA = "KZazBEonSMnZfZ7vFJA";
        var idMLB = "KZazBEonSMnZfZ7vF1n";
        var idNHL = "KZazBEonSMnZfZ7vFEE";
        var idNFL = "KZazBEonSMnZfZ7vFE1";

        var qurl = "https://app.ticketmaster.com/discovery/v2/events.json?apikey=Vvr4nxUQd9eJW45jli8KXF14XyVHA74u&startDateTime=" + startDate + "T00:00:00Z&endDateTime=" + endDate + "T23:59:00Z&city=" + destination + "&countryCode=US" + "&subGenreId=" + idNBA + "&subGenreId=" + idMLB + "&subGenreId=" + idNHL + "&subGenreId=" + idNFL;

        $.ajax({
            type: "GET",
            url: qurl,
            async: true,
            dataType: "json",
            success: function (json) {
                console.log(json);
                console.log(qurl);
                //added if statement to run if events were found in dest city
                if (json && json._embedded && json._embedded.events && json._embedded.events.length && json._embedded.events.length > 0) {
                    // json._embedded.events is an unsorted array containing the event objects. The next line will sort them chronologically.
                    json._embedded.events.sort(function (a, b) {
                        return new Date(b.dates.start.dateTime) - new Date(a.dates.start.dateTime);
                    });
                    function toStandardTime(militaryTime) {
                        militaryTime = militaryTime.split(':');
                        if (militaryTime[0].charAt(0) == 1 && militaryTime[0].charAt(1) > 2) {
                            militaryTime = (militaryTime[0] - 12) + ':' + militaryTime[1] + ' P.M.';
                        } else if
                            (militaryTime[0].charAt(0) == 2 && militaryTime[0].charAt(1) >= 0) {
                            militaryTime = (militaryTime[0] - 12) + ':' + militaryTime[1] + ' P.M.';
                        }
                        else {
                            militaryTime.pop();
                            militaryTime.join(':') + ' A.M.';
                        }
                        return militaryTime;
                    }
                    console.log(toStandardTime('16:30:00'));
                    for (i = 0; i < json._embedded.events.length; i++) {
                        name = (json._embedded.events[i].name);
                        date = (json._embedded.events[i].dates.start.localDate);
                        time = (json._embedded.events[i].dates.start.localTime);
                        league = (json._embedded.events[i].classifications[0].subGenre.name);
                        dateTime = (json._embedded.events[i].dates.start.dateTime)

                        //updateHTML
                        $("#table-main").prepend("<tr><td>" + name + "</td><td>" + date + "</td><td>" + toStandardTime(time) + "</td><td>" + league + "</td></tr>");

                        //push to database so we can see what users are searching
                        database.ref().push({
                            dateStart_d: startDate,
                            dateEnd_d: endDate,
                            name_d: name,
                            userCity_d: origin,
                            destCity_d: destination,
                        });
                    };
                    //added this just as an example if no events found within date range dest city
                } else {
                    console.log("no events found");
                }
            },
            error: function (xhr, status, err) {
            }
        });
    };
    // *************** END TICKETMASTER QUERY ***************     

    // *************** START MAPS QUERY ***************
    function getMapsInfo(s, d) {
        var mapsURL = "https://maps.googleapis.com/maps/api/distancematrix/json?key=AIzaSyBZ-tqiabQTnQLaxbWjeuLU5avoCbDVZm0&units=imperial&origins=" + s + "&destinations=" + d;

        $.ajax({
            url: mapsURL,
            method: "GET",
            async: true,
            dataType: "json"
        })
            .then(function (response) {
                console.log(mapsURL);
                console.log(response);
                travelDistance = response.rows[0].elements[0].distance.text;
                console.log(travelDistance);
                $("#travel-distance").html("Distance from " + userCity + " to " + destCity + " is " + travelDistance + ".");
            });
    };

    // *************** UPDATE HTML WITH DISTANCE ***************

    // *************** END UPDATE HTML WITH DISTANCE ***************

    // *************** END MAPS QUERY ***************

    // *************** DATABASE SNAPSHOT ***************

    database.ref().on("child_added", function (snap) {
        count++;
        console.log("added:", snap.key);
    });

    // length will always equal count, since snap.val() will include every child_added event
    // triggered before this point
    database.ref().once("value", function (snap) {
        console.log("initial data loaded!", snap.numChildren() === count);
        console.log(count);
        $("#database-count").html("Total home games found for other fans: " + count);
    });
    // *************** END DATABASE SNAPSHOT***************
});
