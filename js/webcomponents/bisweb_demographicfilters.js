/*  LICENSE
    
    _This file is Copyright 2018 by the Image Processing and Analysis Group (BioImage Suite Team). Dept. of Radiology & Biomedical Imaging, Yale School of Medicine._
    
    BioImage Suite Web is licensed under the Apache License, Version 2.0 (the "License");
    
    - you may not use this software except in compliance with the License.
    - You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)
    
    __Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.__
    
    ENDLICENSE */
    "use strict";
    const util=require('bis_util');
    const webutil=require('bis_webutil');
    const $=require('jquery');
    const BisWebPanel = require('bisweb_panel.js');
    /**
    <kelly-newcomponent viewerid="#viewer" layoutmanager="#layout"></kelly-newcomponent>
    */
    // -------------------------------------------------------------------------
    class DemographicFilters extends HTMLElement {
    
        constructor() {
            super(); // Initializes the parent class
            this.panel=null;
        }
    
        initialize() {
            let btn=$('#filterbutton');
            console.log('BTN=',btn);
            btn.click( (e) => {
                console.log('Help',e);
                e.preventDefault();
                window.alert('Hello');
            });
        }
        
        connectedCallback() {
            let viewerid=this.getAttribute('bis-viewerid');
            let layoutid=this.getAttribute('bis-layoutwidgetid');
            let layoutcontroller=document.querySelector(layoutid);
            
            this.panel=new BisWebPanel(layoutcontroller,
                                       {  name  : "Demographic Information",
                                          permanent : true,
                                          width : '290',
                                          dual : false,
                                       });
            this.parentDomElement=this.panel.getWidget();
    
            const html=`
    
    <H4>Enter Demographic Information</H4>
    Select which features you would like to search for. 

    <div>                       
        Age: <input type="number" id="ageNumber" min="0" step="1" data-bind="value:replyNumber" />
    </div>
    <div>                       
        Weight: <input type="number" id="weightNumber" min="0" step="1" data-bind="value:replyNumber" />
    </div>
    <div class="dropdown">
        <button class="btn btn-primary dropdown-toggle btn-block" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            Sex
        </button>
        <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton">
            <li><a class="dropdown-item" href="#">Male</a></li>
            <li><a class="dropdown-item" href="#">Female</a></li>
            <li><a class="dropdown-item" href="#">Other</a></li>
        </ul>
    </div>
    <div class="dropdown">
        <button class="btn btn-primary dropdown-toggle btn-block" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            Race
        </button>
        <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton">
            <li><a class="dropdown-item" href="#">Asian</a></li>
            <li><a class="dropdown-item" href="#">Black</a></li>
            <li><a class="dropdown-item" href="#">Hispanic or Latino</a></li>
            <li><a class="dropdown-item" href="#">Native Hawaiian or Other Pacific Islander</a></li>
            <li><a class="dropdown-item" href="#">White</a></li>
            <li><a class="dropdown-item" href="#">Other Enter Below</a></li>
        </ul>
    </div>

    <button type="button" class="btn btn-success">Next</button>
    
    `;  // Multiline string use ` delimiter '''
    
            this.parentDomElement.append(html);
            this.show();
            
            setTimeout( () => {
                this.initialize();
            },1000);
    
        }
                                    
    
        show() {
            this.panel.show();
        }
    
        isOpen() {
            return this.panel.isOpen();
        }
    }
    
    module.exports=DemographicFilters;
    webutil.defineElement('demographic-filters', DemographicFilters);