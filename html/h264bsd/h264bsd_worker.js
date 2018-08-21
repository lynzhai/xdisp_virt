if(typeof(H264bsdDecoder) === "undefined") {
    importScripts('h264bsd_decoder.js', 'h264bsd_asm.js')
}

var noInput = true;

function onMessage(e) {
    var message = e.data;
    switch(message.type) {
    case 'queueInput' :
        decoder.queueInput(message.data);
        if(noInput) {
          noInput = false;
          decodeLoop();
        }
        break;
    }
}

function onPictureReady() {
    var width = decoder.outputPictureWidth();
    var height = decoder.outputPictureHeight();
    var croppingParams = decoder.croppingParams();
    var output = decoder.nextOutputPicture();

    postMessage({
      'type' : 'pictureReady',
      'width' : width,
      'height' : height,
      'croppingParams' : croppingParams,
      'data' : output.buffer,
    }, [output.buffer]);
}

function onHeadersReady() {
    var width = decoder.outputPictureWidth();
    var height = decoder.outputPictureHeight();
    var croppingParams = decoder.croppingParams();

    postMessage({
      'type' : 'pictureParams',
      'width' : width,
      'height' : height,
      'croppingParams' : croppingParams,
    });
}

function decodeLoop() {
 //   var t1 = (new Date()).valueOf();
    var result = decoder.decode(); //var t2 = (new Date()).valueOf();console.log('H264 decode='+(t2-t1));

    switch(result) {
    case H264bsdDecoder.ERROR:
        postMessage({'type': 'decodeError'});
        break;
    case H264bsdDecoder.PARAM_SET_ERROR:
        postMessage({'type': 'paramSetError'});
        break;
    case H264bsdDecoder.MEMALLOC_ERROR:
        postMessage({'type': 'memAllocError'});
        break;
    case H264bsdDecoder.NO_INPUT:
        noInput = true;
        postMessage({'type': 'noInput'});
        break;
    default:
        setTimeout(decodeLoop, 0);
    }
}

addEventListener('message', onMessage);
var decoder = new H264bsdDecoder(Module)
decoder.onPictureReady = onPictureReady;
decoder.onHeadersReady = onHeadersReady;
postMessage({'type': 'decoderReady'});
