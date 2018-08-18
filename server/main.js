import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  // code to run on server at startup
    
    var URL_TOKEN = 'https://iam-api.dss.husqvarnagroup.net/api/v3/token';
    var URL_STATUS= 'https://amc-api.dss.husqvarnagroup.net/v1';

    
     Meteor.methods({
         
         Get_Token : function(_user,_pass){
            
            console.log("GET TOKEN")
            
            var token={}
            HTTP.post(URL_TOKEN, {
                data: {
                    data: {
                        attributes: {
                            username:_user,
                            password:_pass
                        },
                    type: "token" 
                    }
                },
                headers: {
                    
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            }, function( error, response ) {
                if ( error ) {
                    console.log( error );
                } else {
                   // console.log( response.data.data.attributes );
                    token.id=response.data.data.id;
                    token.expire=response.data.data.attributes.expires_in;
                    token.provider=response.data.data.attributes.provider;
                    //token.userId=response.data.data.attributes.user_id;
                }
            });
         
            var timeout=0;
            while (token.id==undefined){
                //console.log("sleep")
                Meteor._sleepForMs(100); 
                timeout =timeout+ 100;
                if (timeout==5000){
                //console.log("timeout")
                    break;
                }
            }
            return token;
         },
         
         Get_Robot : function (_idtoken,_providertoken) {
             
             var robot={}
             //console.log("GET ROBOT : "+_idtoken+" "+_providertoken)
             HTTP.get(URL_STATUS+"/mowers/", {
                data:{},
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '+_idtoken,
                    'Authorization-Provider':_providertoken,
                },
             }, function( error, response ) {
                if ( error ) {
                    console.log( error );
                } else {
                    console.log(response.data[0]);
                    robot=response.data[0];
                }
             });
        
             var timeout=0;
             
             while (robot.id==undefined){
                //console.log(robot.id)  
                Meteor._sleepForMs(100); 
                timeout =timeout+ 100;
                if (timeout==5000){
                    //console.log("timeout")
                    break;
                }
             }
    
             return robot;
         },
         
         Get_More : function (_idtoken,_id_mower,_providertoken) {
             
             var robot={id:undefined}
             //console.log("GET MORE : "+_idtoken+" "+_id_mower+" "+_providertoken)
             //console.log(URL_STATUS+"/mowers/"+_id_mower+"/");
             HTTP.get(URL_STATUS+"/mowers/"+_id_mower+"/", {
                data:{},
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer '+_idtoken,
                    'Authorization-Provider':_providertoken,
                },
             }, function( error, response ) {
                if ( error ) {
                    console.log( error );
                } else {
               //     console.log((response.data));
                    robot=response.data;  
                }
             });
             
             var timeout=0;
             while (robot.id==undefined){
                Meteor._sleepForMs(100); 
                timeout =timeout+ 100;
                if (timeout==15000){
                    console.log("timeout")
                    break;
                }
             }
             
             return robot;
         }
     });
});
