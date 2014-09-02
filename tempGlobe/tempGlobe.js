
/*Copyright (C) 2014  Tim Hoffmann and  Nadja Kutz

Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.



The following program builts upon WebGL Earth as of July 2014 http://www.webglearth.org/  which has also an Apache 2.0 license and which uses http://cesiumjs.org/. Further components of WebGl Earth are an adaption to http://leafletjs.com/ API's. The included map layer is from openstreetmap.org. 



The program reads in global surface temperature data from CRUTEM 4
Explanations at:
http://www.cru.uea.ac.uk/cru/data/temperature/crutem4/station-data.htm
The original file was retrieved from: http://www.cru.uea.ac.uk/cru/data/temperature/crutem4/crutem4_asof020611_stns_used.zip
on Aug 20, 2014 ca. 10.00 am and stored locally. In order to make the file machine readable, some spacings had to be modified. This had been done with an automated replace within emacs. The data itself hasn't been modified to the best knowledge of the authors.

email contact: nad AND@thendaytarDOTde
*/

var Station = function(n, la, lo, h, d) {
    this.name = n;
    this.longitude = lo;
    this.latitude = la;
    this.height = h;
    this.date = d;
    this.data = new Object();
    this.polygon = null;
    this.marker = null;
}

var stations = new Array();
var earth;
var month = 10;
var year = 1980;
var markersVisible = false;

var skip = 100;

function parseText(fullText) {

    // we made a separate div Element to write into
    var div = document.getElementById("writeTo");


    //parse out the various data:

    // reads in the columns of each line in the text into an array
    var lines = fullText.split("\n");
    var i = 0;
    var station;
    var data = new Object();
    for(l=0; l<lines.length; l++) {
	if (lines[l].substring(0,1)!="#") {
	    var cols = lines[l].match(/[\w\.-]+/g);
//	    if (/^[a-z]+$/i.test(cols[4])) {
	    if (cols.length != 13) {
		var name = cols[4];
		var len = cols.length-4;
		var date = cols[len];
		for(j= 5; j< 4+cols.length-8;j++){
		    name += " "+cols[j];
		   }
		station = new Station(name, cols[1]/10., -cols[2]/10., cols[3], date);
		data = station.data;
		stations[i] = station;
		i++;
	    } else {
		data[cols.shift()] = cols;
	    }
	}
    }

    div.innerHTML+="There are alltogether "+stations.length+" stations.";   
    //for(k = 508; k< 1188; k++) { Russian stations
    /*for(k = 508; k< 509; k++) {
	div.innerHTML+="Station:  " +stations[k].name + " at "+stations[k].latitude+", "+stations[k].longitude+", measurement period: "+stations[k].date+"<BR/>";
	//div.innerHTML+="year 1980  " +stations[k].data["1980"] +"<BR/>";
    }*/
	//alert("written");


	earth = new WE.map('earth_div');
	WE.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
            attribution: '© OpenStreetMap contributors'
	}).addTo(earth);

	for (k=0; k<stations.length;k+=skip){
	    var stat = stations[k];
	    makeStationRep(stat);
	}

    setDate(month,year);
    earth.setView([48, 6], 5);
    document.getElementById("slider").value='0';
}    

function makeStationRep(stat) {
    var la = stat.latitude;
    var lo = stat.longitude;
    var temperature = "---";
    
    stat.marker = WE.marker([la, lo ])
    if(markersVisible)
	stat.marker.addTo(earth);
    stat.marker.bindPopup('name: '+stat.name+'<br/> temp: '+temperature+'<br/>la lo: '+stat.latitude+', '+stat.longitude+ '<br/> measurement period:'+stat.date);
    
    var polygonA = WE.polygon([[la-.5, lo -.5], [la-.5, lo+.5],
	[la+.5, lo+.5], [la+.5,lo-.5]], {
	    color: '#000',
	    fillColor: '#000',
	    fillOpacity: 0.,
	    weight: 0.001,
	}
			     );
    stat.polygon = polygonA.addTo(earth);
}

function setMonth(m) {
    var mspan = document.getElementById(month);
    mspan.style.background='#ccc';
    month = m;
    setDate(month, year);
    mspan = document.getElementById(month);
    mspan.style.background='#eecc00';
}
function setYear(y) {
    var yspan = document.getElementById(year);
    yspan.style.background='#ccc';
    year = y;
    setDate(month, year);
    yspan = document.getElementById(year);
    yspan.style.background='#eecc00';
}


function setDate(month, year) {
    for (k=0; k<stations.length;k=k+skip){
	var stat = stations[k];
	var la = stat.latitude;
	var lo = stat.longitude;
	var tempString = "---";
	var temperature = -99.9;
	var tColor = '#000';
	var tOpa = 0.;
	if(stat.data[year] != null) {
	    var temperature = parseFloat(stat.data[year][month])/10.;
		
	    if(temperature !=-99.9) {
		tempString = temperature;
		temperature = temp2Scale(temperature);
		tColor = hexHSV(scale2HueRange(temperature), 1., 1.);
		tOpa = 1.;
	    } else tOpa =1.;
	}

	// ensure that marker and polygon are in place:
//	if(stat.polygon == null) {
//	    stat.polygon = stat.polyProto.addTo(earth);
//	    if(markersVisible)
//		stat.marker.addTo(earth);
//	}
	stat.marker.bindPopup('station: '+stat.name+'<br/> temp: '+tempString+ ' degree Celsius<br/>latitude, longitude: '+stat.latitude+', '+stat.longitude+ '<br/>measurement period:' +stat.date.substring(0,4)+'--'+stat.date.substring(4,8));
	stat.polygon.setFillColor(tColor,tOpa);
    }
}

function setDensity(d) {
    setSkip(102-d);
}

function setSkip(sk) {
    for(l = 0; l<stations.length; l+=skip) {
	var stat = stations[l];
	stat.polygon.destroy();
	stat.polygon = null;
	stat.marker.detach();
	stat.marker = null;
    }
    skip = parseFloat(sk);
    if(skip<1) 
	skip =1;
    for(l = 0; l<stations.length; l+=skip) {
	var stat = stations[l];
	makeStationRep(stat);
    }
    setDate(month,year);
}

function toggleMarkers() {
    markersVisible = !markersVisible;
    setShowMarkers(markersVisible);
}
function setShowMarkers(show) {
    if(show)
	for (k=0; k<stations.length;k=k+skip){
	    stations[k].marker.addTo(earth);
	}
    else
	for (k=0; k<stations.length;k=k+skip){
	    stations[k].marker.detach();
	}

}


// maps temperature range to 0--100
function temp2Scale(temperature) {
    temperature+=20;
    temperature = temperature*100./40.;
    if(temperature<0) temperature = 0;
    if(temperature>100) temperature =100;
    return temperature;
}
function scale2HueRange(s) {
    return ((100-s)*.65)/100.;
}

function hexHSV(h, s, v) {
    
    var c = s*v;
    var hp = 6*h;
    var x = c*(1 - Math.abs((hp%2) - 1));
    var r; 
    var g; 
    var b;
    if(hp<1) {
	r = c;
	g = x;
	b = 0;
    } else if(hp<2) {
	r = x;
	g = c;
	b = 0;
    } else if(hp<3) {
	r = 0;
	g = c;
	b = x;
    } else if(hp<4) {
	r = 0;
	g = x;
	b = c;
    } else if(hp<5) {
	r = x;
	g = 0;
	b = c;
    } else {
	r = c;
	g = 0;
	b = x;
    }
    m = v-c;
    r += m;
    g += m;
    b += m;
    r = Math.floor(r*255);
    g = Math.floor(g*255);
    b = Math.floor(b*255);
    var str = ((r<<16)+(g<<8)+b).toString(16);
    for(i= str.length;i<6;i++)
	str = '0'+str;
    return '#'+str;
}

function draw() {
    var canvas;
    canvas=document.getElementById("co2id");
    var ctx=canvas.getContext("2d");
    for(l = 0; l<101;l++) {
	var coco = hexHSV(scale2HueRange(l),1.,1.);
	//alert("we have "+(l/101.)+" -> "+coco);
	ctx.fillStyle= coco;
	//ctx.lineWidth=1;
	ctx.beginPath();
	ctx.moveTo(6*l,0);
	ctx.lineTo(6*(l+1),0);
	ctx.lineTo(6*(l+1),10);
	ctx.lineTo(6*(l),10);
	ctx.fill();
    }
    ctx.fillStyle= '#000';
    for( t = -20;t<=20; t+=5) {
	var x = 6*temp2Scale(t)+1;
	ctx.beginPath();
	ctx.moveTo(x,10);
	ctx.lineTo(x,25);
	ctx.stroke();
	ctx.fillText(t,x+5,21);
    }
}


// getText(filename) reads the given file via a XHTMLRequest this is subtle since the the call is asynchronous so parsing needs to start only after the data is loaded
function getText(filename) {
    var txtFile = new XMLHttpRequest();
    txtFile.overrideMimeType("text/plain");
    txtFile.open("GET", filename, true);
    txtFile.onreadystatechange = function() {
	if (txtFile.readyState === 4) {  // document is ready to parse.
            if (txtFile.status === 200 || window.location.href.indexOf("http")==-1) {  // file is found
		var fullText = txtFile.responseText; 
		// now we can parse the text.
		parseText(fullText);
            }
	    
	}
    }
    txtFile.send(null);
}

function hexColor(t) {
    if(t == -999) return '#000';
    t+=50;
    if (t<0) t = 0;
    if(t>100) t = 100;
    var r = Math.round(t*2.55);
    var b = Math.round(((t-50)*(t-50)/25)*2.55);
    var g = Math.round(t*t/100.*2.55);
    var str = ((r<<16)+(g<<8)+b).toString(16);
    for(i= str.length;i<6;i++)
	str = '0'+str;
    return '#'+str;
}

function init() {
    
    draw();
    var ydiv = document.getElementById("ydiv");
    for(dec=2010; dec>=1700;dec-=10){
	for( tens= 0; tens<(dec==2010?2:10);tens++) {
	    var y = dec+tens;
	    var elem = document.createElement('span');
	    elem.setAttribute('onclick','setYear(\"'+y+'\");');
	    elem.setAttribute('class','year');
	    elem.setAttribute('id',y);
	    elem.appendChild(document.createTextNode(" "+y));

	    if(y == year) 
		elem.style.background='#eecc00';
   
	    ydiv.appendChild(elem);
	}
	ydiv.appendChild(document.createElement('br'));
    }
    var mspan = document.getElementById(month);
    mspan.style.background='#eecc00';
    
    getText("crutem4_asof020611_stns_used.dat");
    

        
}

/*drawing*/

