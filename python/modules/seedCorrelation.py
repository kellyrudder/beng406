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
import math
import numpy as np
import argparse
import bis_basemodule
import bis_objects
import modules_desc
import biswrapper as libbis;

class seedCorrelation(bis_basemodule.baseModule):

    def __init__(self):
        super().__init__();
        self.name='seedCorrelation';
   
    def createDescription(self):
        return modules_desc.descriptions['seedCorrelationImage'];

    def directInvokeAlgorithm(self,vals):
        print('oooo invoking: seedCorrelation with vals', (vals));
        input = self.inputs['input'];
        weight=self.inputs['weight'];
        regressor = self.inputs['regressor'];
        
        try:
            out = libbis.computeSeedCorrelationImageWASM(input, regressor, weight, {
                "toz" : self.parseBoolean(vals['zscore'])
            },self.parseBoolean(vals['debug']));
            self.outputs['output']=out;
        except:
            print('---- Failed to invoke algorithm');
            return False
        
        return True;

if __name__ == '__main__':
    import bis_commandline; sys.exit(bis_commandline.loadParse(seedCorrelation(),sys.argv,False));
    
