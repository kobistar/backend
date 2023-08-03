Pre spustenie a správne fungovanie je potrebné doinštalovať tieto závyslosti

npm install morgan nodemon ajv axios ejs express express-ejs-layouts multer sharp

Samotné spustenie je možné sprostredkovať dvoma spôsobmi z root
	1. node server.js -> Pre klasicke spustenie používateľom

	2. npm run dev -> Pre spustenie používané developerom.
		-> Toto spustenie sprístupňuje devDependecies
		-> Zároveň sa server pri každej zmene kódu sám reštartuje, aby sa aplikovali zmeny v kóde

index.js 
	-> možný preklik na zobrazenie všetkých galérii
	-> http://localhost:3000/

gallery.js 
	-> Obsahuje spracovenie backend requestov:
		-> Get /gallery -> výpis všetkých galérii
			-> http://localhost:3000/gallery
	
		-> Post /gallery -> pridanie novej galérie
			-> http://localhost:3000/gallery		

	-> Pre obe requesty je spravený aj jednoduchý frontend, ktorý sa nachádza v adresáry views/galleries/galleries.ejs
	-> Pri vytvorení galérie existuje aj voliteľná možnosť pridať aj titulnú fotku


one_gallery.js 
	-> Obsahuje spracovenie backend requestov:
		-> Get /gallery/:path -> zobrazenie obsahu konkrétnej galérie
			-> http://localhost:3000/gallery/:path

		-> Post /gallery/:path -> pridanie fotky do konkrétnej galérie
			-> http://localhost:3000/gallery/:path

		-> Delete /gallery/:path -> vymazanie konkrétnej fotky alebo galérie
			-> http://localhost:3000/gallery/:galleryPath%2F:imagePath(.png/.jpg)
			-> http://localhost:3000/gallery/:gallerypath

		-> Get /images/:w(\\d+)x:h(\\d+)/:path -> zobrazenie fotky z konkrétnej galérie v ľubovoľnej veľkosti
			-> http://localhost:3000/images/wxh/galleryPath%2FimagePath

	-> Frontend je spravený len pre prvé dva requesty, ktorý sa nachádza v adresáry views/galleries/gallery.ejs
	-> Keďže delete request nemá frontendove prepojenie, bol testovaný len v aplikáci Postamn




	
