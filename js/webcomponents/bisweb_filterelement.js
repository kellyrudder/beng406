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
    class FilterElement extends HTMLElement {
    
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
                                       {  name  : "Filtering Options",
                                          permanent : true,
                                          width : '290',
                                          dual : false,
                                       });
            this.parentDomElement=this.panel.getWidget();
    
            const html=`
    
    <H4>Select Filters</H4>
    Select which features you would like to search for. 

    <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="flexCheckDefault">
        <label class="form-check-label" for="flexCheckDefault">
            Filter on Demographic Information
        </label>
    </div>
    <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="flexCheckDefault">
        <label class="form-check-label" for="flexCheckDefault">
            Filter on Quanitative Features 
        </label>
    </div>
    <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="flexCheckDefault">
        <label class="form-check-label" for="flexCheckDefault">
            Filter on Qualitative Features
        </label>
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
    
    module.exports=FilterElement;
    webutil.defineElement('filter-element', FilterElement);