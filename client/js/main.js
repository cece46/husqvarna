import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import '/client/templates/main.html';
import '/config/config.js'

if (Meteor.isClient) {
    
    var myrobot={};    
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
    
    // Actualisation des données Husqvarna
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
            {
                Session.set('LOGIN',false)
            }  
            
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
                                             tmpl.newMap2.setZoom(16)
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
            if (Session.get('LOGIN'))
            {
                $('body').css('background-image', 'none');
            }else{
                $('body').css('background-image', 'url(http://www.robot-tondeuse.info/wp-content/uploads/2016/06/Automower-420-2-1024x768.jpg)');
                $('body').css('background-size', 'cover');
            }
            return Session.get('LOGIN')
        },
        
        iscutting : function(){
          
            myrobot=Session.get("myrobot")
            if(myrobot.status.mowerStatus == "OK_CUTTING") {
                return true
            }else{
                return false
            }
            
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
            Progress_Bar_Color();
            return myrobot.status.batteryPercent;
        },
        connected:function(){
            myrobot=Session.get("myrobot")
            if (myrobot.status.connected){
                return true
            }
            else{
                return false
            }
        },
        state:function(){
            
            myrobot=Session.get("myrobot")
            $(".progress").removeClass("progress-striped active");

            switch (myrobot.status.mowerStatus) {
                case "PARKED_AUTOTIMER":
                    text = "Stationné";
                    break;
                case "OK_CUTTING":
                    text = "Tonte";
                    break;
                case "OK_CHARGING":
                    $(".progress").addClass("progress-striped active");

                    text = "En Charge";
                    break;
                
                case "OK_SEARCHING":
                    text = "En direction de la station de charge."
                    break;
                case "OK_LEAVING":
                    text = "Retrait de la station de charge."
                    break;
   
                case "PAUSED" : 
                    text="En Pause"
                    break;
                case "PARKED_PARKED_SELECTED" : 
                    text="Stationné"
                    break;
                case "OFF_HATCH_OPEN" : 
                    text="Arrêté"
                    break;
                case "OFF_HATCH_CLOSED_DISABLED" : 
                    text="Arrêté"
                    break;
                    
                case "ERROR" :
                    text = "Erreur détectée"
                    break;
                    
                case "ERROR_AT_POWER_UP" :
                    text = "Erreur au démarrage"
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
                    text = "Minuterie adaptative (météo). "
                    if (parseInt(myrobot.status.nextStartTimestamp)>0) {
                            text+="Prochain démarrage le "+ConvertTimpestampLocale((myrobot.status.nextStartTimestamp));
                    }
                     
                     if(myrobot.status.mowerStatus=="PARKED_PARKED_SELECTED") {
                          text = "Jusqu'à nouvel ordre. ";
                     } 
                           
                            
                    break;
                     
                case "NO_SOURCE":
                     
                    switch (myrobot.status.mowerStatus) {
                             
                        case "OK_CUTTING":
                            text="En cours... "
                            if (parseInt(myrobot.status.nextStartTimestamp)>0) {
                                text+="Fin de la session de tonte à "+ConvertTimpestampLocale((myrobot.status.nextStartTimestamp));
                            }
                            break;
                             
                        case "OK_CHARGING" : 
                            text = "Chargé à "+myrobot.status.batteryPercent+"%. "
                            if (parseInt(myrobot.status.nextStartTimestamp)>0) {
                                text+="Prochain démarrage le "+ConvertTimpestampLocale((myrobot.status.nextStartTimestamp));;
                            }   
                            break;
                         
                        case "HOME" : 
                            text = "Jusqu'à nouvel ordre. ";
                            break;
                        
                        case "OK_LEAVING" :
                             text = "";
                             break;
                             
                        case "OFF_HATCH_CLOSED_DISABLED" :
                             text = "Action manuelle requise. "
                             
                        default:
                            text="";
                            break;
                    } 
                    
                    break;
                     
                case "MOWER_CHARGING":
                    text = "Chargé à "+myrobot.status.batteryPercent+"%. "
                    if (parseInt(myrobot.status.nextStartTimestamp)>0) {
                        text+="Prochain démarrage le "+ConvertTimpestampLocale((myrobot.status.nextStartTimestamp));;
                     } 
                    break;
                     
                case "COUNTDOWN_TIMER" :
                    
                     if (myrobot.status.mowerStatus=="OFF_HATCH_OPEN"){
                         text="Demande de code PIN. "
                     }
                     
                     if (myrobot.status.mowerStatus== "PARKED_AUTOTIMER" || myrobot.status.mowerStatus=="PARKED_PARKED_SELECTED"){
                         if (parseInt(myrobot.status.nextStartTimestamp)>0) {
                            text+="Prochain démarrage le "+ConvertTimpestampLocale((myrobot.status.nextStartTimestamp));;
                         } 
                     }
            
                     if (myrobot.status.mowerStatus=="OK_SEARCHING")
                         text="Recherche de la station de charge. "
                     
                     break;
                     
                case "OK_SEARCHING" :
                     if (myrobot.status.mowerStatus=="OFF_HATCH_OPEN")
                         text="Recherche de la station de charge. "
                     
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
        },
        error:function(){
            myrobot=Session.get("myrobot")
            switch (myrobot.status.lastErrorCode) {
                
//Your mower has status: ERROR Code: 01 => A l'extérieur de la zone
//Your mower has status: ERROR Code: 02 => Coupure fil périphérique
//Your mower has status: ERROR Code: 10 => A l'envers
//Your mower has status: ERROR Code: 13 => Robot bloqué (Erreur de propulsion)
//Your mower has status: ERROR Code: 15 => Robot soulevé
//Your mower has status: ERROR Code: 25 => Disque de coupe bloqué
//Your mower has status: ERROR Code: 69 => Arrêt manuel de l'interrupteur
//Your mower has status: ERROR Code: 74 => En dehors de la zone de protection virtuelle 
                    
                    
                case 19: 
                    text="Problème sur capteur frontal" 
                    break;
                case 18: 
                    text="Problème sur capteur arrière"
                    break;
                case 15: 
                    text="Robot levé"
                    break;
                case 10: 
                    text="Robot renversé"
                    break;
                case 2: 
                    text="Batterie déchargée"
                    break;
                case 1: 
                    text="Robot à l'extérieur de la zone de surveillance"
                    break;       
                case 0:
                    text="Aucune erreur"
                    break;
                    
                default:
                    text=myrobot.status.lastErrorCode
                    break;
            }
            if (parseInt(myrobot.status.lastErrorCodeTimestamp)>0) {
                text+="le "+ConvertTimpestampLocale((myrobot.status.lastErrorCodeTimestamp));
            }
            return text;
            
        },
        coupemm:function(){
            myrobot=Session.get("myrobot")
            for (i=0;i<myrobot.settings.length;i++){
                
                if(myrobot.settings[i].id == "cuttingHeight"){
                    return myrobot.settings[i].value+"mm";
                }
            }
        },
        spirale:function(){
            myrobot=Session.get("myrobot")
            for (i=0;i<myrobot.settings.length;i++){
                
                if(myrobot.settings[i].id == "general.runSpiralCutting"){
                    
                    if(myrobot.settings[i].value){
                        
                        for (j=0;j<myrobot.settings.length;j++){
                            if(myrobot.settings[j].id == "general.spiralCuttingIntensity"){
                                
                                switch (myrobot.settings[j].value) {
                                    case 1 : 
                                        intensity="(Très basse)"
                                        break;
                                    case 2 : 
                                        intensity="(Basse)"
                                        break;
                                    case 3 : 
                                        intensity="(Moyenne)"
                                        break;
                                    case 4 : 
                                        intensity = "(Haute)"
                                        break;
                                    case 5:
                                        intensity="(Très Haute)"
                                        break;
                                }
                            }
                        }
                
                        return "Oui "+intensity}
                    else{
                        return "Non"}
                }
            }
        },
        meteo:function(){
            myrobot=Session.get("myrobot")
            for (i=0;i<myrobot.settings.length;i++){
                
                if(myrobot.settings[i].id == "weatherTimer.runWeatherTimer"){
                   
                    if(myrobot.settings[i].value){
                        return "Oui"}
                    else{
                        return "Non"}
                }
            }
        },
        ecomode:function(){
            myrobot=Session.get("myrobot")
            for (i=0;i<myrobot.settings.length;i++){
                
                if(myrobot.settings[i].id == "general.runEcoMode"){
                   
                    if(myrobot.settings[i].value){
                        return "Oui"}
                    else{
                        return "Non"}
                }
            }
        },
        
        /* onglet stat */
        
        km_tonte:function(){
            
            myrobot=Session.get("myrobot")
            var path=[];
            var i=0;
            for(i=0;i<((myrobot.status.lastLocations).length);i++){

                var sub = [myrobot.status.lastLocations[i]["latitude"],myrobot.status.lastLocations[i]["longitude"]]
                path.push(sub);

            }
            
            var distance=0;
            for(i=0;i<path.length;i=i+2){
                distance+=parseFloat(distanceFrom(path[i],path[i+1]))

            }
            return distance.toFixed(3)+' km / '+(myrobot.status.lastLocations).length+ " derniers points"
        }
        
    });
    
    Template.robot_status.events({
       
        'click #status-tab' :function(evt){
            
            evt.preventDefault();
            
            var mapelmt = document.getElementById("el_map");
            mapelmt.style.visibility="visible";
            var tabselmt = document.getElementById("conteneur_status");
            tabselmt.style.display="flex";
        },
         'click #controle-tab' :function(evt){
            
            evt.preventDefault();
            
            var mapelmt = document.getElementById("el_map");
            mapelmt.style.visibility="visible";
            var tabselmt = document.getElementById("conteneur_status");
            tabselmt.style.display="flex";
        },
         'click #version-tab' :function(evt){
            
            evt.preventDefault();
            
            var mapelmt = document.getElementById("el_map");
            mapelmt.style.visibility="visible";
            var tabselmt = document.getElementById("conteneur_status");
            tabselmt.style.display="flex";
        },
        'click #stats-tab' :function(evt){
            
            evt.preventDefault();
            var mapelmt = document.getElementById("el_map");
            mapelmt.style.visibility="hidden";
            var tabselmt = document.getElementById("conteneur_status");
            tabselmt.style.display="absolute";
        },
        
        'click #stopstart' :function(evt){
            evt.preventDefault();
            
            var state=document.getElementById("stopstart").value;
            if (state == "Pause"){
                state="STOP"  
            }else{
                state="START"
            }
            if (confirm('Voulez-vous envoyer la commande '+state+'?')) {
                Meteor.call('Post_Control',idToken, idProvider, idMower,state,
                    function(error, result){
                        if(error){
                            alert('Error post');
                        }else{
                            alert("Retour du serveur: "+result)
                        }
                })
            } 
        },
        'click #park' :function(evt){
            evt.preventDefault();
            if (confirm('Voulez-vous envoyer la commande '+"PARK"+'?')) {               
                Meteor.call('Post_Control',idToken, idProvider, idMower,"PARK",
                    function(error, result){
                        if(error){
                            alert('Error post');
                        }else{
                            alert("Retour du serveur: "+result)
                        }
                })
            }
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
    
    function Progress_Bar_Color(){
        
        if (parseInt(myrobot.status.batteryPercent) > 70) {
             $("#progress").removeClass("progress-bar-warning");
             $("#progress").removeClass("progress-bar-danger");
             $("#progress").addClass("progress-bar-success");
            }
        if (parseInt(myrobot.status.batteryPercent) <= 70 && parseInt(myrobot.status.batteryPercent) > 30 ){
             $("#progress").removeClass("progress-bar-warning");
             $("#progress").removeClass("progress-bar-danger");
             $("#progress").addClass("progress-bar-warning");
        }
        if (parseInt(myrobot.status.batteryPercent) <= 30) {
             $("#progress").removeClass("progress-bar-warning");
             $("#progress").removeClass("progress-bar-success");
             $("#progress").addClass("progress-bar-danger");
        }
    }
    
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
            lat: 46.50789,  //FRANCE
            lng: 4.03854,   // FRANCE
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
          //tmpl.setMapTypeId("osm");

      
        });
        
//        $(".list-container").css("max-height",$(".map-canvas").height()+'px')



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
                
        if (Session.get('LOGIN')) {
            Progress_Bar_Color();
        }
        
    });

    function ConvertTimpestamp(timestamp){

        var d = new Date(timestamp * 1000)	// Convert the passed timestamp to milliseconds
        return d.toLocaleString();
    }
    
    function ConvertTimpestampLocale(timestamp){

        var d = new Date(timestamp * 1000)	// Convert the passed timestamp to milliseconds
        return d.toLocaleString('fr-FR', { timeZone: 'UTC' });
    }

    function distanceFrom(points1,points2) {
        var lat1 = points1[0];
        var radianLat1 = lat1 * (Math.PI / 180);
        var lng1 = points1[1];
        var radianLng1 = lng1 * (Math.PI / 180);
        var lat2 = points2[0];
        var radianLat2 = lat2 * (Math.PI / 180);
        var lng2 = points2[1];
        var radianLng2 = lng2 * (Math.PI / 180);
        var earth_radius = 6371; // 6371 for kilometers
        var diffLat = (radianLat1 - radianLat2);
        var diffLng = (radianLng1 - radianLng2);
        var sinLat = Math.sin(diffLat / 2);
        var sinLng = Math.sin(diffLng / 2);
        var a = Math.pow(sinLat, 2.0) + Math.cos(radianLat1) * Math.cos(radianLat2) * Math.pow(sinLng, 2.0);
        var distance = earth_radius * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
        return distance.toFixed(3); //km
    }

    
}