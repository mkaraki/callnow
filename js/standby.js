var peer;
var call;
var mediaStream;

function dispError(title, desc) {
    $('#error-window').toggleClass('hide', false);
    document.getElementById('error-title').innerText = title;
    document.getElementById('error-desc').innerText = desc;
}

function dispIncoming(from) {
    $('#incoming-window').toggleClass('hide', false);
    document.getElementById('incoming-id').innerText = from;
}

function setStatus(status) {
    document.getElementById('status').innerText = status;
    document.title = status + ' - Call now';

    document.getElementById('noncall-ind').innerText = status.toUpperCase();
}

function isAudioOnly() {
    if (call === undefined) return undefined;
    if (!call.open) return undefined;

    return call.remoteStream.getVideoTracks().length < 1;
}

function complete(stream) {
    setStatus('Booting');

    peer = new Peer({
        config: {
            'iceServers': [
                { url: 'stun:stun.l.google.com:19302' }
            ]
        }
    });
    mediaStream = stream;

    $('#status-window').toggleClass('hide', false);
    $('#outgoing-window').toggleClass('hide', false);

    peer.on('open', function (id) {
        $('#number-self').text(id);

        setStatus('Standby');
    });

    peer.on('call', function (rcall) {
        call = rcall
        callInitialize();
        dispIncoming(rcall.peer);
    });
}

function callInitialize() {
    call.on('stream', function (remoteStream) {
        var video = document.getElementById('call-video');
        video.srcObject = remoteStream;
        console.log('stream started');

        $('#call-video').toggleClass('hide', isAudioOnly());
        $('#audio-ind').toggleClass('hide', !isAudioOnly());
        $('#noncall-ind').toggleClass('hide', true);

        $('#user-ind').toggleClass('hide', false);
        document.getElementById('user-ind').innerText = call.peer;

        $('#ongoing-controller-window').toggleClass('hide', false);
        $('#outgoing-window').toggleClass('hide', true);
        $('#incoming-window').toggleClass('hide', true);
    });

    call.on('close', function () {
        call = undefined;
        console.log('call closed');

        $('#call-video').toggleClass('hide', true);
        $('#audio-ind').toggleClass('hide', true);
        $('#noncall-ind').toggleClass('hide', false);
        $('#user-ind').toggleClass('hide', true);

        $('#incoming-window').toggleClass('hide', true);
        $('#outgoing-window').toggleClass('hide', false);
        $('#ongoing-controller-window').toggleClass('hide', true);

        setStatus('Standby');
    });

    call.on('error', function (err) {
        console.log('error' + err);
        $('#incoming-window').toggleClass('hide', true);
        $('#outgoing-window').toggleClass('hide', false);
        $('#ongoing-controller-window').toggleClass('hide', true);
    });
}

document.getElementById('outgoing-dial').onclick = function () {
    var on_dom = document.getElementById('outgoing-number');

    call = peer.call(on_dom.value, mediaStream);

    call.on();

    callInitialize();
}

document.getElementById('incoming-accept').onclick = function () {
    if (call === undefined) return;

    call.answer(mediaStream);
}

document.getElementById('incoming-decline').onclick = function () {
    if (call === undefined) return;

    call.close();
    $('#incoming-window').toggleClass('hide', true);
}

document.getElementById('ongoing-hangup').onclick = function () {
    if (call === undefined) return;

    call.close();
}

document.getElementById('close-btn').onclick = function () {
    window.close();
}

document.getElementById('init-start').onclick = function () {
    var usevideo = document.getElementById('init-usevideo').checked;

    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    window.URL = window.URL || window.webkitURL;

    navigator.getUserMedia({ video: usevideo, audio: true }, complete, function (err) {
        setStatus('Error');
        dispError('Access Denied', "Couldn't connect to your camera or mic.");
    });

    $('#initialize-window').remove();
}

window.onbeforeunload = function () {
    if (peer !== undefined) {
        peer.disconnect();
        peer.destroy();
    }
}