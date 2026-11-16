import {build} from 'esbuild';
import {cp, mkdir, writeFile} from 'node:fs/promises';
await mkdir('dist', {recursive:true});
await cp('public','dist',{recursive:true});
await build({entryPoints:['src/main.jsx'],bundle:true,jsx:'automatic',minify:true,outfile:'dist/app.js',define:{'process.env.NODE_ENV':'"production"'}});
for (const [file,title] of Object.entries({index:'Resumen de seguros',pruebas:'Primer pago',banco:'Verificación de identidad',pago:'Primer pago',retorno:'Resultado del pago','retorno-3ds':'Resultado del pago'})) {
  await writeFile('dist/'+file+'.html', `<!doctype html><html lang="es-CO"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | Seguros Alfa</title><link rel="stylesheet" href="/estilos.css"><script defer src="/app.js"></script></head><body class="${file.startsWith('retorno')?'result':''}"><div id="root"></div></body></html>`);
}
