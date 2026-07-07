function slugify(str){return String(str==null?'':str).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}
function itemUrl(v,cat){
  if(cat==='vehicules-vente'||cat==='vehicules-location') return '/'+cat+'/'+slugify(v.brand+' '+v.model+' '+v.year);
  return '/'+cat+'/'+slugify(v.titre||'');
}
