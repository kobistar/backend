Pre spustenie a správne fungovanie je potrebné spustiť príkaz v terminály 
npm install 

Samotné spustenie je možné sprostredkovať dvoma spôsobmi z root
1. Pre klasicke spustenie používateľom

		-> node server.js
	
2. Pre spustenie používané developerom.
	
 	-> Toto spustenie sprístupňuje devDependecies
	-> Zároveň sa server pri každej zmene kódu sám reštartuje, aby sa aplikovali zmeny v kóde

   		-> npm run dev

index.js 

	-> http://localhost:3000/

gallery.js 
-> Obsahuje spracovenie backend requestov:

-> Get /gallery -> výpis všetkých galérii

	-> http://localhost:3000/gallery
  	
-> Post /gallery -> pridanie novej galérie
	
 	-> http://localhost:3000/gallery		

-> Delete /gallery/:gallery -> vymazanie konkrétnej galérie

	-> http://localhost:3000/gallery/:gallery

one_gallery.js 
-> Obsahuje spracovenie backend requestov:

-> Get /gallery/:gallery -> zobrazenie obsahu konkrétnej galérie

	-> http://localhost:3000/gallery/:gallery
-> Post /gallery/:gallery -> pridanie fotky do konkrétnej galérie, zároveň ak je to prvá fotka pridaná do galérie uloží sa ako titlePhoto

	-> http://localhost:3000/gallery/:gallery
-> Delete /gallery/:gallery/:image -> vymazanie konkrétnej fotky

 	-> http://localhost:3000/gallery/:gallery/image

resize_Image.js
-> Obsahuje spracovanie zmeny veľkosti fotky a jej následné zobrazenie

-> Get /images/:w(\\d+)x:h(\\d+)/:gallery/:image -> zobrazenie fotky z konkrétnej galérie v ľubovoľnej veľkosti

	-> http://localhost:3000/images/wxh/gallery/image



	
