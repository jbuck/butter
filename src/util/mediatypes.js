/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

"use strict";

define( [ "util/xhr", "util/uri" ],
  function( XHR, URI ) {

  var REGEX_MAP = {
    youtube: /(?:https?:\/\/www\.|https?:\/\/|www\.|\.|^)youtu/,
    vimeo: /https?:\/\/(www\.)?vimeo.com\/(\d+)($|\/)/,
    soundcloud: /(?:https?:\/\/www\.|https?:\/\/|www\.|\.|^)(soundcloud)/
  };

  var EXAMPLES = {
    youtube: "http://www.youtube.com/watch?v=CLg2JbELs9o",
    html5: "http://popcorn.webmadecontent.org/videos/getstarted.mp4"
  };

  return {
    checkUrl: function( url ) {
      for ( var type in REGEX_MAP ) {
        if ( REGEX_MAP.hasOwnProperty( type ) ) {
          if ( REGEX_MAP[ type ].test( url ) ) {
            return type;
          }
        }
      }
      return "html5";
    },
    getMetaData: function( baseUrl, callback, type ) {
      var data = {},
          id,
          parsedUri,
          xhrURL,
          testEl;

      if ( baseUrl === "test" ) {
        baseUrl = EXAMPLES.youtube;
      }

      type = data.type = type || this.checkUrl( baseUrl );
      callback = callback || function(){};

      if ( type === "youtube" ) {
        parsedUri = URI.parse( baseUrl );
        id = parsedUri.queryKey.v || parsedUri.directory.replace( "/", "" );
        if ( !id ) {
          return;
        }
        xhrURL = "https://gdata.youtube.com/feeds/api/videos/" + id + "?v=2&alt=jsonc";
        XHR.get( xhrURL, function( resp ) {
          var raw = JSON.parse( resp.target.responseText ).data;

          if ( !raw ) {
            return;
          }
          data.source = "http://www.youtube.com/v=" + id;
          data.title = raw.title;
          data.thumbnail = raw.thumbnail.hqDefault;
          data.author = raw.uploader;
          data.duration = raw.duration;
          data.denied = raw.accessControl.embed === "denied";
          callback( data );
        });
      } else if ( type === "soundcloud" ) {
        data.source = baseUrl;
        data.title = URI.parse( baseUrl ).path;
        callback( data );
      } else if ( type === "html5" ) {
        testEl = document.createElement( "video" );
        testEl.addEventListener( "loadedmetadata", function( e ) {
          data.source = baseUrl;
          data.title = baseUrl.substring( baseUrl.lastIndexOf( "/" ) + 1 );
          data.thumbnail = testEl;
          data.duration = testEl.duration;
          callback ( data );
        }, false );
        testEl.src = URI.makeUnique( baseUrl ).toString();
      }
    }
  };
});