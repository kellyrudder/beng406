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


#ifndef _bis_Advanced_Image_Algorithms_h
#define _bis_Advanced_Image_Algorithms_h

#include "bisDataTypes.h"
#include "bisSimpleDataStructures.h"
#include "bisAbstractTransformation.h"
#include "bisUtil.h"
#include "bisEigenUtil.h"
#include "math.h"
#include <vector>


/**
 * Mostly Templated functions for implementing various core image processing routines
 */
namespace bisAdvancedImageAlgorithms {

  /** compute MIP or shading-color 2d projection of an image
   * @param input the input image
   * @param domip - if >0 use mip else use 2d-integration
   * @param axis - the axis to integrate/project along
   * @param flip - if true integrate from 0 -> maxdim instead of maxdim->0
   * @param lps - if true y-axis needs to be flipped ....
   * @param sigma - the smoothing to use on the image
   * @param threshold - the threshold for 2d integration
   * @param gradsigma - how much to smooth for gradient computation (if 0 then no shading is applied)
   * @param windowsize - how many voxels to average
   * @returns the projected image
   */
  template<class T> std::unique_ptr<bisSimpleImage<T> >  projectImage(bisSimpleImage<T>* input,
                                                                      int domip=0,int axis=-1,int flip=0,int lps=0,float sigma=1.0,
                                                                      float threshold=0.05,float gradsigma=1.0,int windowsize=3);

   /** create and add a grid overlay on an image
   * @param input the input image
   * @param gap - the number of voxels between each grid line
   * @param value - the fractional intensity of the lines (1.0=same as max intensity of the image)
   * @returns the projected image
   */
  template<class T> std::unique_ptr<bisSimpleImage<unsigned char> >  addGridToImage(bisSimpleImage<T>* input,int gap=8,float value=1.0);

    /** compute 2d->3d back projection
   * @param threed_input the 3d input image
   * @param twod_input the 2d input image
   * @param axis - the axis to integrate/project along
   * @param flip - if true integrate from 0 -> maxdim instead of maxdim->0
   * @param threshold - the threshold for 2d integration
   * @param windowsize - how many voxels to smear to
   * @returns the back-projected image
   */
  template<class T> std::unique_ptr<bisSimpleImage<T> >  backProjectImage(bisSimpleImage<T>* threed_input,
                                                                          bisSimpleImage<T>* twod_input,
                                                                          int axis,int flip,
                                                                          float threshold,int windowsize);


  /** compute  shading-color 2d projection of an image (possibly) functional image with a mask to specify boundaries
   * @param input - the input image
   * @param mask - the mask image
   * @param output - the output image
   * @param axis - the axis to integrate/project along
   * @param flip - if true integrate from 0 -> maxdim instead of maxdim->0
   * @param lps - if true y-axis needs to be flipped ....
   * @param gradsigma - how much to smooth for gradient computation (if 0 then no shading is applied)
   * @param windowsize - how many voxels to average
   * @returns the projected image
   */
  template<class T> int projectImageWithMask(bisSimpleImage<T>* input,
                                             bisSimpleImage<T>* mask,
                                             bisSimpleImage<float>* output,
                                             int axis=-1,int flip=0,int lps=0,
                                             float gradsigma=1.0,int windowsize=3);
}


#ifndef BIS_MANUAL_INSTANTIATION
#include "bisAdvancedImageAlgorithms.txx"
#endif

  
#endif
