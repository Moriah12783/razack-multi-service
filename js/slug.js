// Browser copy of the slug logic in lib/slugify.js. MUST stay byte-for-byte
// equivalent in behaviour so catalog "Voir la fiche" links resolve to the exact
// generated detail pages — including the -<id> duplicate disambiguation.
//
// Note: the Node lib branches on the category KEY ('vente'/'location'); in the
// browser we branch on the catalog CAT string ('vehicules-vente'/'vehicules-location').
function slugify(str){return String(str==null?'':str).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}

function baseSlug(item,cat){
  if(cat==='vehicules-vente'||cat==='vehicules-location'){
    return slugify(item.brand+' '+item.model+' '+item.year);
  }
  return slugify(item.titre||((item.type||'')+' '+(item.quartier||'')+' '+item.id));
}

// Run over the WHOLE array in JSON/file order (same order as the Node build) so
// duplicate disambiguation matches. Mutates each item with .slug and .url.
function assignSlugs(items,cat){
  var seen={};
  return items.map(function(item){
    var s=baseSlug(item,cat);
    if(Object.prototype.hasOwnProperty.call(seen,s)){
      seen[s]=seen[s]+1;
      s=s+'-'+item.id;
    }else{
      seen[s]=1;
    }
    item.slug=s;
    item.url='/'+cat+'/'+s;
    return item;
  });
}

// Kept for backward-compatibility; prefer precomputing item.url via assignSlugs.
function itemUrl(v,cat){
  return '/'+cat+'/'+baseSlug(v,cat);
}
