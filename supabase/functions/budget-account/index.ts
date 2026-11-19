import {createClient} from 'npm:@supabase/supabase-js@2.119.1';

const origins=new Set(['https://www.bakhtiyaraj.dev','https://bakhtiyaraj.dev','https://localhost']);
Deno.serve(async request=>{
 const origin=request.headers.get('Origin');
 const headers={'Content-Type':'application/json','Cache-Control':'no-store',...(origin&&origins.has(origin)?{'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info, x-bt-epoch','Access-Control-Allow-Methods':'POST, OPTIONS'}:{})};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(origin&&!origins.has(origin))return reply({error:'origin'},403);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(request.method!=='POST')return reply({error:'method'},405);
 if(Number(request.headers.get('content-length')||0)>8192)return reply({error:'request'},413);
 const token=request.headers.get('Authorization')?.replace(/^Bearer\s+/i,'');if(!token)return reply({error:'authentication'},401);
 const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data:identity,error:authError}=await admin.auth.getUser(token);
 const user=identity?.user;
 if(authError||!user||user.is_anonymous)return reply({error:'authentication'},401);
 try{
  const text=await request.text();if(text.length>8192)return reply({error:'request'},413);
  const body=JSON.parse(text);
  if(body.userId||!['preview','delete'].includes(body.action))return reply({error:'request'},400);
  const scope=await admin.rpc('bt_identity_scope',{owner:user.id});if(scope.error)throw scope.error;
  if(body.action==='preview')return reply(scope.data);
  if(!['data','account'].includes(body.mode)||body.confirm!=='DELETE'||typeof body.password!=='string'||body.password.length>1024)return reply({error:'confirmation'},400);
  if(body.mode==='account'&&(scope.data.shared||scope.data.lastAdmin))return reply({error:scope.data.lastAdmin?'last-admin':'shared-account'},409);
  // A valid refreshed JWT alone is insufficient: verify the current password.
  const client=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const reauth=await client.auth.signInWithPassword({email:user.email!,password:body.password});
  if(reauth.error||reauth.data.user?.id!==user.id)return reply({error:'password'},403);
  await client.auth.signOut({scope:'local'});
  const start=await admin.rpc('bt_begin_reset',{owner:user.id,full_identity:body.mode==='account'});if(start.error)throw start.error;
  // RLS now freezes old clients. Remove physical storage objects through the API.
  const bucket=admin.storage.from('bt-receipts');let removed=0;
  const clean=async(prefix:string,depth=0)=>{
   if(depth>12||removed>100000)throw new Error('storage-limit');
   for(;;){const listing=await bucket.list(prefix,{limit:100});if(listing.error)throw listing.error;if(!listing.data.length)break;
    for(const entry of listing.data){if(!entry.id)await clean(prefix+'/'+entry.name,depth+1);else{const result=await bucket.remove([prefix+'/'+entry.name]);if(result.error)throw result.error;removed++;}}
   }
  };
  await clean(user.id);
  const finished=await admin.rpc('bt_finish_reset',{owner:user.id});if(finished.error)throw finished.error;
  if(body.mode==='account'){
   // Check again before removing the shared Auth identity.
   const latest=await admin.rpc('bt_identity_scope',{owner:user.id});if(latest.error)throw latest.error;
   if(latest.data.shared||latest.data.lastAdmin)return reply({error:'shared-account',dataCleared:true},409);
   const deleted=await admin.auth.admin.deleteUser(user.id);if(deleted.error)throw deleted.error;
  }
  return reply({ok:true,mode:body.mode});
 }catch{return reply({error:'operation-failed'},500)}
});
