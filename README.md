To start and work properly, you need to run the command in the terminal
npm install 

The launch itself can be mediated in two ways from root
1. For classic user launch

		-> node server.js
	
2. For the launch used by the developer.
	
 	-> This run makes devDependecies available
	-> At the same time, every time the code is changed, the server restarts itself in order to apply the changes in the code

   		-> npm run dev

index.js 

	-> http://localhost:3000/

gallery.js 
-> Contains processing of backend requests:

-> Get /gallery -> list of all galleries

	-> http://localhost:3000/gallery
  	
-> Post /gallery -> add a new gallery
	
 	-> http://localhost:3000/gallery		

-> Delete /gallery/:gallery -> delete a specific gallery

	-> http://localhost:3000/gallery/:gallery

one_gallery.js 
-> Contains processing of backend requests:

-> Get /gallery/:gallery -> display the content of a particular gallery

	-> http://localhost:3000/gallery/:gallery
-> Post /gallery/:gallery -> adding a photo to a specific gallery, at the same time if it is the first photo added to the gallery, it will be saved as titlePhoto

	-> http://localhost:3000/gallery/:gallery
-> Delete /gallery/:gallery/:image -> delete a specific photo

 	-> http://localhost:3000/gallery/:gallery/image

resize_Image.js
-> Contains the processing of changing the size of the photo and its subsequent display

-> Get /images/:w(\\d+)x:h(\\d+)/:gallery/:image -> display a photo from a specific gallery in any size

	-> http://localhost:3000/images/wxh/gallery/image



	
