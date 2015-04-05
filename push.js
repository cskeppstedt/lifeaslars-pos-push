(function() {
    var watchingId,
        currentPosition,
        map,
        marker;

    var btnStartWatch = document.getElementById('btnStartWatch'),
        btnStoptWatch = document.getElementById('btnStopWatch'),
        btnPublish = document.getElementById('btnPublish'),
        publish = document.getElementById('publish'),
        published = document.getElementById('published'),
        loader = document.getElementById('loader');

    var checkApiAvailable = function() {
        if (!("geolocation" in navigator)) {
            alert('Your browser does not have the geolocation API');
          return false;
        }

        return true;
    };

    var showLoader = function() {
        loader.classList.remove('hide');
    };

    var hideLoader = function() {
        loader.classList.add('hide');
    };

    var showPublish = function() {
        publish.classList.remove('hide');
    };

    var showPublished = function() {
        published.classList.remove('hide');
    };

    var hidePublished = function() {
        published.classList.add('hide');
    };

    var toggleWatchButton = function() {
        btnStopWatch.classList.toggle('hide');
        btnStartWatch.classList.toggle('hide');
    };

    var setPositionText = function(text) {
        document.getElementById('position').innerHTML = text;
    };

    var renderPosition = function() {
        var latLng = new google.maps.LatLng(
            currentPosition.coords.latitude,
            currentPosition.coords.longitude
        );

        showPublish();

        setPositionText('Lat: ' + latLng.lat() + ' <br/>Lng: ' + latLng.lng());
        setPositionMap(latLng);
    };

    var onPosition = function(position) {
        console.debug('onPosition', position);
        currentPosition = position;

        if (currentPosition) {
            hideLoader();
            renderPosition();
        }
    };

    var onPositionFail = function() {
        console.error('Fetching location failed', arguments);
        stopWatching();
    };

    var startWatching = function() {
        toggleWatchButton();
        showLoader();
        setPositionText('Wait...');
        watchingId = navigator.geolocation.watchPosition(onPosition, onPositionFail);
    };

    var stopWatching = function() {
        toggleWatchButton();
        hideLoader();
        navigator.geolocation.clearWatch(watchingId);
        watchingId = undefined;
    };

    if (!checkApiAvailable())
        return;

    var fb = new Firebase("https://lifeaslars.firebaseio.com");

    var setPositionMap = function(latLng) {
        if (marker) {
            marker.setPosition(latLng);
        } else {
            initMap(latLng);
        }
    };

    var updateMap = function(latLng) {
        marker.setPosition(latLng);
    };

    var initMap = function(latLng) {
        map = new google.maps.Map(document.getElementById("map"), {
            zoom: 8,
            center: latLng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        marker = new google.maps.Marker({
            position: latLng,
            map: map
        });
    };

    var onWatchClick = function() {
        if (watchingId) {
            stopWatching();
        } else {
            startWatching();
        }
    };

    var onPublishClick = function() {
        var coords = currentPosition.coords,
            resource = {
                lat: coords.latitude,
                lng: coords.longitude,
                timestampUtc: new Date().getTime()
            },
            message = "Publish this position?\nLat: " + resource.lat + '\nLng: ' + resource.lng;

        if (!confirm(message)) {
            return;
        }

        hidePublished();
        stopWatching();
        showLoader();
        btnPublish.setAttribute('disabled', 'disabled');

        fb.child('location/latest').set(resource, function(error) {
            if (error) {
                onPublished(error);
                return;
            }

            fb.child('location').push(resource, onPublished);
        });
    };

    var onPublished = function(error) {
        var errorMessage = document.getElementById('published__error');

        hideLoader();
        showPublished();
        btnPublish.removeAttribute('disabled');

        if (error) {
            published.classList.add('published--fail');
            errorMessage.innerText = 'Error: ' + error;
            errorMessage.classList.remove('hide');
            console.error(error);
        } else {
            published.classList.remove('published--fail');
            errorMessage.classList.add('hide');
        }
    };

    btnStartWatch.addEventListener('click', onWatchClick);
    btnStopWatch.addEventListener('click', onWatchClick);
    btnPublish.addEventListener('click', onPublishClick);
})();