#!/usr/bin/env python3

# LICENSE
# 
# _This file is Copyright 2018 by the Image Processing and Analysis Group (BioImage Suite Team). Dept. of Radiology & Biomedical Imaging, Yale School of Medicine._
# 
# BioImage Suite Web is licensed under the Apache License, Version 2.0 (the "License");
# 
# - you may not use this software except in compliance with the License.
# - You may obtain a copy of the License at [http://www.apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)
# 
# __Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.__
# 
# ENDLICENSE


import bis_path
import sys
import biswebpython.core.bis_basemodule as bis_basemodule
import biswebpython.core.bis_objects as bis_objects
import bismodules_desc
import biswrapper as libbis;

class regressOut(bis_basemodule.baseModule):

    def __init__(self):
        super().__init__();
        self.name='regressOut';
   
    def createDescription(self):
        return bismodules_desc.descriptions['regressOut'];

    def directInvokeAlgorithm(self,vals):

        print('oooo invoking: regressOut with vals', (vals));
        input = self.inputs['input'];
        regressor = self.inputs['regressor'];
        weight=self.inputs['weight'];
            
        try:
            out = libbis.weightedRegressOutWASM(input,
                                                regressor,
                                                weight, 
                                                self.parseBoolean(vals['debug']));
            self.outputs['output']=bis_objects.bisMatrix();
            self.outputs['output'].create(out);
        except:
            print('---- Failed to invoke algorithm');
            return False
        
        return True;

    
if __name__ == '__main__':
    import biswebpython.core.bis_commandline as bis_commandline;
    sys.exit(bis_commandline.loadParse(regressOut(),sys.argv,False));
