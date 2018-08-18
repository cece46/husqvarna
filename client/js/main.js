import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import '/client/templates/main.html';
import '/config/config.js'

if (Meteor.isClient) {
    
    var myrobot={};
    var MAP_ZOOM  = 18;
    
    var idToken, idProvider, idMower, expiredToken="";
    
    var tmpl, zone, course, geoloc="";
    
    Session.setDefault('myrobot', "");
    Session.setDefault('LOGIN', false);
    Session.setDefault('idToken',"");
    Session.setDefault('expiredToken',"");
    Session.setDefault('idProvider', "");
    Session.setDefault('idMower', "");
    Session.setDefault('LastLat', "");
    Session.setDefault('LastLng', "");
    
    Meteor.setInterval(function(){
        
        if (Session.get('LOGIN')) {
        
           idToken=Session.get('idToken')
           idMower=Session.get('idMower')
           idProvider=Session.get('idProvider')
           
           Meteor.call('Get_More',idToken,idMower,idProvider,function(errorM,resultM){
                if(errorM){
                     alert('erreur robot')
                 }else{
                     Session.set('myrobot', resultM );
                     Draw_Geoloc(tmpl);
                     Draw_Course(tmpl);
                 }
            });     
            
        }
        
    },10000);
    
    Template.authentification.helpers({
        
        'isLogged' : function(){
            
            Session.set('expireToken',(parseInt(Date.now())+parseInt(Session.get('expiredToken'))));
                    
            if ( parseInt(Date.now()) >  parseInt(Session.get('expireToken')))
                Session.set('LOGIN',false)
            
            return Session.get('LOGIN')
        }
    });

    Template.authentification.events({
       
        'click #submit':function(e){
            
            e.preventDefault();
            var USER=document.getElementById("inputEmail").value;
            var PASSWORD=document.getElementById("inputPassword").value;

            if ((USER != undefined)&&(PASSWORD != undefined)) {
                Meteor.call('Get_Token', USER, PASSWORD, function(error, result){
                    if(error){
                        alert('Error token');
                    }else{
                        if (result.id != undefined) {
                            
                            Session.set('LOGIN',true)
                            idToken=result.id;
                            Session.set('idToken',idToken)
                            idProvider=result.provider;
                            Session.set('idProvider',idProvider)
                            expiredToken=result.expire;
                            Session.set('expiredToken',expiredToken)

                            Meteor.call('Get_Robot',result.id,result.provider, function(errorR,resultR){
                                if(errorR){
                                    alert('erreur robot')
                                }else{
                                    Session.set('myrobot', resultR );
                                    idMower=resultR.id
                                    Session.set('idMower',idMower)

                                    Meteor.call('Get_More',idToken,idMower,idProvider,function(errorM,resultM){
                                        if(errorM){
                                             alert('erreur robot')
                                         }else{
                                             Session.set('myrobot', resultM );
                                             Draw_Geoloc(tmpl);
                                         }
                                    });
                                }
                            });
                        }else
                            alert("Indentifiant ou mot de passe incorrect.")
                    }
                }); 
            }else //if
            {
                alert("Veuillez saisir une adresse mail et un mot de passe.")    
            }
            
        } //function click
        
    });
    
    Template.robot_status.helpers({
         
        'isLogged' : function(){
            return Session.get('LOGIN')
        },
        
        name:function(){
            myrobot=Session.get("myrobot")
            return myrobot.name;
        },
        id:function(){
           myrobot=Session.get("myrobot")
           return myrobot.id;
        },
        battery:function(){
            myrobot=Session.get("myrobot")
           return myrobot.status.batteryPercent;
        },
        connected:function(){
            myrobot=Session.get("myrobot")
            if (myrobot.status.connected)
                return "Oui"
            else
                return "Non"
        },
        state:function(){
            
            myrobot=Session.get("myrobot")
            
            switch (myrobot.status.mowerStatus) {
                case "PARKED_AUTOTIMER":
                    text = "Stationnée";
                    break;
                case "OK_CUTTING":
                    text = "Tonte";
                    break;
                case "OK_CHARGING":
                    text = "En Charge";
                    break;
                case "OK_CUTTING":
                    text = "Tonte";
                    break;
                case "OK_SEARCHING":
                    text = "En direction de la station de charge."
                    break;
                case "PAUSED" : 
                    text="En Pause"
                    break;
                case "PARKED_PARKED_SELECTED" : 
                    text="Stationnée"
                    break;
                default:
                    text = myrobot.status.mowerStatus;
                    break;
            }
                    
            return text;
        },
        info:function(){
            
            myrobot=Session.get("myrobot")
            
             switch (myrobot.status.nextStartSource) {
                case "COMPLETED_CUTTING_TODAY_AUTO":
                    text = "Minuterie adaptative (météo)."+"Prochain démarrage le "+ConvertTimpestampLocale((myrobot.status.nextStartTimestamp));
                    break;
                case "NO_SOURCE":
                      if (myrobot.status.mowerStatus == 'OK_CUTTING') {
                         text="Fin de la session de tonte à "+myrobot.status.nextStartTimestamp
                     }                

                     if (myrobot.status.mowerStatus == 'OK_CHARGING') {
                         text = "Chargé à "+myrobot.status.batteryPercent+" %."+"Prochain démarrage le "+ConvertTimpestampLocale((myrobot.status.nextStartTimestamp));;
                     }  
                     
                     
                     if (myrobot.status.operatingMode == 'HOME') {
                         text = "Jusqu'à nouvel ordre";
                     }  
                     
                     
                     
                    break;
                case "MOWER_CHARGING":
                    text = "Chargé à "+myrobot.status.batteryPercent+" %."+"Prochain démarrage le "+ConvertTimpestampLocale((myrobot.status.nextStartTimestamp));
                    break;
                     
                case "COUNTDOWN_TIMER" :
                     text = "Prochain démarrage le "+ConvertTimpestampLocale((myrobot.status.nextStartTimestamp));
                     break;
                     
                case "OK_SEARCHING" :
                    break;
                     
                 default:
                    text = myrobot.status.nextStartSource;
                    break;         
            }
                    
            return text
            
        },
        time:function(){
            myrobot=Session.get("myrobot")
           return ConvertTimpestamp((myrobot.status.storedTimestamp)/1000);
        }
        
    });
    
    Template.map.helpers({
         'isLogged' : function(){
            return Session.get('LOGIN')
        }, 
    });
    
    Template.mapCanvas2.events({
        
        'click #carto':function(e,tmpl){
            
            tmpl.newMap2.addMarker({
                lat: 46.50789,
                lng: 4.03854,
                title: 'Marker with InfoWindow',
                infoWindow: {
                    content: '<p>Zone de protection virtuelle</p>'
                }
            });  
   
            
//        var zoneGeoloc={};
//        zoneGeoloc.zoneAlarmeLat = myrobot.centralPoint.location.latitude;
//        zoneGeoloc.zoneAlarmeLng = myrobot.centralPoint.location.longitude;
//        MAP_ZOOM = 12//myrobot.centralPoint.sensitivity.level;
//        var RADIUS=13//myrobot.centralPoint.sensitivity.radius;
//
//        tmpl.newMap2.drawCircle({
//              lat: zoneGeoloc.zoneAlarmeLat,
//              lng: zoneGeoloc.zoneAlarmeLng,
//              radius: 500,
//              fillColor: 'blue',
//              fillOpacity: 0.5,
//              strokeWeight: 0
//        });
//
//        tmpl.newMap2.setCenter(zoneGeoloc.zoneAlarmeLat, zoneGeoloc.zoneAlarmeLng);
//        tmpl.newMap2.setZoom(15)
        
        },
        
        'click #myonoffswitchZ':function(evt){
            //evt.preventDefault();
            Draw_Circle_Zone(tmpl)
        },
        'click #myonoffswitchC':function(evt){
            //evt.preventDefault();
            Draw_Course(tmpl)
        }
    });
    
    function Draw_Circle_Zone (tmpl) {

        myrobot=Session.get("myrobot")

        var actif = (document.getElementById("myonoffswitchZ").checked);
        if (actif) {
            var zoneGeoloc={};
            zoneGeoloc.zoneAlarmeLat = myrobot.centralPoint.location.latitude;
            zoneGeoloc.zoneAlarmeLng = myrobot.centralPoint.location.longitude;

            zone = tmpl.newMap2.drawCircle({
                  lat: zoneGeoloc.zoneAlarmeLat,
                  lng: zoneGeoloc.zoneAlarmeLng,
                  radius: 500,
                  fillColor: 'blue',
                  fillOpacity: 0.1,
                  strokeWeight: 0
            });
            tmpl.newMap2.setCenter(zoneGeoloc.zoneAlarmeLat, zoneGeoloc.zoneAlarmeLng);
            tmpl.newMap2.setZoom(16)
        }
        else{
            if (zone != undefined)
                zone.setMap(null)
            //if the above does not work, try this:
            //c.remove();
        }
    }
    
    // Point géoloc du robot
    function Draw_Geoloc (tmpl) {
       
        myrobot=Session.get("myrobot")
        Session.set('LastLat',myrobot.status.lastLocations[0]["latitude"])
        Session.set('LastLng',myrobot.status.lastLocations[0]["longitude"])
        
        if (geoloc != "")
            geoloc.setMap(null)
        
        geoloc=tmpl.newMap2.addMarker({
            lat:Session.get('LastLat'),
            lng:Session.get('LastLng'),
        });  
        
        tmpl.newMap2.setCenter(Session.get('LastLat'),Session.get('LastLng')); 
        tmpl.newMap2.setZoom(tmpl.newMap2.getZoom())
    }
    
    function Draw_Course (tmpl) {
    
        var actif = (document.getElementById("myonoffswitchC").checked);
        if (actif) {

            myrobot=Session.get("myrobot")

            var path=[];
            var i=0;
            for(i=0;i<((myrobot.status.lastLocations).length);i++){

                var sub = [myrobot.status.lastLocations[i]["latitude"],myrobot.status.lastLocations[i]["longitude"]]
                path.push(sub);

            }
    
            if (course != undefined)
                course.setMap(null)
            
            course=tmpl.newMap2.drawPolyline({
              path: path,
              strokeColor: '#ff1400',
              strokeOpacity: 0.6,
              strokeWeight: 6
            });
                  
            tmpl.newMap2.setCenter(myrobot.status.lastLocations[0]["latitude"], myrobot.status.lastLocations[0]["longitude"]);   
            tmpl.newMap2.setZoom(tmpl.newMap2.getZoom())
        }
        else{
            if (course != undefined)
                course.setMap(null)        }
    }

    Template.mapCanvas2.rendered = function () {
        
        tmpl = this;
        VazcoMaps.init({}, function() {

          tmpl.mapEngine = VazcoMaps.gMaps();
   
          tmpl.newMap2 = new tmpl.mapEngine({
            div: '#map-canvas2',
            lat: 46.50789,
            lng: 4.03854,
            zoom: 6,
            mapTypeControlOptions: {
                mapTypeIds : ["hybrid", "roadmap", "satellite", "terrain", "osm"]
            }
          });
            
          tmpl.newMap2.addMapType("osm", {
              getTileUrl: function(coord, zoom) {
                return "https://a.tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
              },
              tileSize: new google.maps.Size(256, 256),
              name: "OpenStreetMap",
              maxZoom: 18
          });
      
        });

    };

    Template.mapCanvas2.events({
        'submit form': function(e, tmpl) {
          e.preventDefault();
          var searchInput = $(e.target).find('#address');

          tmpl.newMap.removeMarkers();
          tmpl.mapEngine.geocode({
            address: searchInput.val(),
            callback: function(results, status) {
              if (status == 'OK') {
                var latlng = results[0].geometry.location;
                tmpl.newMap.setCenter(latlng.lat(), latlng.lng());
                tmpl.newMap.addMarker({
                  lat: latlng.lat(),
                  lng: latlng.lng(),
                  draggable: true,
                  dragend: function() {
                    var point = this.getPosition();
                    tmpl.mapEngine.geocode({location: point, callback: function(results) {
                      searchInput.val(results[0].formatted_address);
                      tmpl.newMap.setCenter(results[0].geometry.location.lat(), results[0].geometry.location.lng());
                    }});
                  }
                });
                searchInput.val(results[0].formatted_address);
              } else {
                console.log(status);
              }
            }
          });

        }
    });
    
    Meteor.startup(function() {
        

    });

    function ConvertTimpestamp(timestamp){

        var d = new Date(timestamp * 1000)	// Convert the passed timestamp to milliseconds
        return d.toLocaleString();
    }
    
    function ConvertTimpestampLocale(timestamp){

        var d = new Date(timestamp * 1000)	// Convert the passed timestamp to milliseconds
        return d.toLocaleString('fr-FR', { timeZone: 'UTC' });
    }

    
}