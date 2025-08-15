1 primer paso confiugrar los actores que van a obtener los datos de las redes sociales en apify 

2 clasificar esos datos obtenidos e ir los ordenando para la obtencion de esos datos desde backend en node

3 creacion de endpoints que van a viajar a apify para obtener los datos
  3.1 crear endp para consultar datos de youtube profile videos comments
  3.1 crear endp para consultar datos de tiktok profile videos comments
  3.1 crear endp para consultar datos de instagram profile videos comments
  3.1 crear endp para consultar datos de twwiter profile videos comments
  3.1 crear endp para consultar datos de facebook profile videos comments

4 entonces por cada red sociales vamos a crear subendpoint para ir ordenando las peticiones

5 crear endpoint unificado para obtencion total de todos los datos de golpe

6 crear job para scrapeo de data cada cierto tiempo (por definir)

7 modulo de unificacion de datos de todas las redes sociales, ver datos en comun y que pueden complementar para dar informacion completa de eso

8 mini job en node para poder ir haciendo peticiones de que se corran los jobs desde el front y que obtenga data nueva 

9 configuracion de mongodb y mongose para guardar datos unificados unicamente los demas datos seran extraidos directamente desde apify 

10 la logica para unificacion de datos sera aprox cada cuantos dias y que se ejecute automaticamente, que consulte uno por uno obtenga los datos los procese y los guarde en la db

11 crear modelo de dato unificado con todas la redes 



***nota mini algoritmo para correr actor ejecutar de manera lastest post y luego por al menos 5 post 20 comentarios por cada post que sesa algo que se ejecute desde el front y que sirva para todas las rrss***



obtener datos unificados este proceso puede durar unos minutos
desde que fecha a que fecha los quiere
obtener de que redes sociales
empezar...

obtienes uno por uno, perfil ya lo tenemos pero posts videos y comments
se va guardando en una variable global y luego segun lo que haya 
vamos guardando esa data en la db


o la otra es programar por defecto desde apify para que cada cierto tiempo se obtenga data de todos los actores que me ordene los datos y obtener solo la data mas relevante y guardarla y que diga de donde viene cada fuente





vistas separadas y por igual 