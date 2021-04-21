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
    class FilterOptions extends HTMLElement {
    
        constructor() {
            super(); // Initializes the parent class
            this.panel=null;
        }
    
        initialize() {
            let btn=$('#kelly1');
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
            console.log("L=",layoutid);
            let layoutcontroller=document.querySelector(layoutid);
    
            console.log('L=',layoutcontroller);
            
            this.panel=new BisWebPanel(layoutcontroller,
                                       {  name  : "Kelly's Component",
                                          permanent : false,
                                          width : '290',
                                          dual : false,
                                       });
            this.parentDomElement=this.panel.getWidget();
    
            const html=`
    <HR>
    <H1>Hello</H1>
    Select which features you would like to search for. 

    <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="flexCheckDefault">
        <label class="form-check-label" for="flexCheckDefault">
            Hemorrhage
        </label>
    </div>
    <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="flexCheckDefault">
        <label class="form-check-label" for="flexCheckDefault">
            Cysts
        </label>
    </div>
    <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="flexCheckDefault">
        <label class="form-check-label" for="flexCheckDefault">
            Satellites
        </label>
    </div>
    <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="flexCheckDefault">
        <label class="form-check-label" for="flexCheckDefault">
            Pial Invasion
        </label>
    </div>
    <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" id="flexCheckDefault">
        <label class="form-check-label" for="flexCheckDefault">
            Calvarial Remodeling 
        </label>
    </div>
    
    </HR>`;  // Multiline string use ` delimiter '''
    
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
    
    module.exports=FilterOptions;
    webutil.defineElement('tumor-filters', FilterOptions);