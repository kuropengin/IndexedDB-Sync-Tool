const db = new Dexie("JupyterLite Storage");

var now_sync = false;
var global_local_db = [];


function indexed_init(){
	console.log("22");
	return new Promise(function (resolve) {
		db.version(0.5).stores({
			checkpoints: "",
			counters: "",
			files: "",
			"local-forage-detect-blob-support": "",
			settings: "",
		});	
		resolve();
	});
}


async function init(){
	var init_flag = await db.settings.get("remote-indexed-init");
	if(init_flag){
		if(!now_sync){
			now_sync = true;
			sync_remote_db();
		}
	}
	else{
		db.settings.put(true,"remote-indexed-init");
		db.settings.put(new Date(0),"remote-indexed-last_modified");
		remote_db_all_pull();
	}
}


function sleep(waitSec) {
    return new Promise(function (resolve) {
        setTimeout(function() { resolve() }, waitSec);
    });
} 


function remote_db_push(push_list){

	return new Promise(async function (resolve) {
		var remote_db_push_req = new XMLHttpRequest();
		var local_db = await db.files.toArray();
		
		var send_data = push_list.map(function(target){
			return local_db.find(function(file){
				return target.path_name == file.path;
			})
		});

		remote_db_push_req.onreadystatechange = function(){
			if(this.readyState == 4 && this.status == 200){
				resolve();
			}
		}
		
		remote_db_push_req.open('post', "/api/push?ealps_sid=00a0000a&ealps_cid=TS0000", true);
		remote_db_push_req.setRequestHeader('Content-Type', 'application/json');
		remote_db_push_req.send(JSON.stringify(send_data)); 
        
    });
}

function remote_db_pull(pull_list){
	return new Promise(async function (resolve) {
		var remote_db_pull_req = new XMLHttpRequest();

		remote_db_pull_req.onreadystatechange = function(){
			if(this.readyState == 4 && this.status == 200){
				var pull_data = JSON.parse(this.responseText);
				pull_data.forEach(function(target){
					db.files.put(target,target.path);
				});
				resolve();
			}
		}
		
		remote_db_pull_req.open('post', "/api/pull?ealps_sid=00a0000a&ealps_cid=TS0000", true);
		remote_db_pull_req.setRequestHeader('Content-Type', 'application/json');
		remote_db_pull_req.send(JSON.stringify(pull_list));

	}); 
}

function remote_db_all_pull(){
	var remote_db_all_pull_req = new XMLHttpRequest();

	remote_db_all_pull_req.onreadystatechange = function(){
		db.files.delete();
		if(this.readyState == 4 && this.status == 200){
			var pull_data = JSON.parse(this.responseText);
			pull_data.forEach(function(target){
				db.files.put(target,target.path);
			})
		}
	}
	
	remote_db_all_pull_req.open('post', "/api/all-pull?ealps_sid=00a0000a&ealps_cid=TS0000", true);
	remote_db_all_pull_req.setRequestHeader('Content-Type', 'application/json');
	remote_db_all_pull_req.send(); 
	
	
}

function remote_db_delete(delete_list){
	return new Promise(async function (resolve) {
		var remote_db_pull_req = new XMLHttpRequest();

		remote_db_pull_req.onreadystatechange = function(){
			if(this.readyState == 4 && this.status == 200){
				resolve();
			}
		}
		
		remote_db_pull_req.open('post', "/api/delete?ealps_sid=00a0000a&ealps_cid=TS0000", true);
		remote_db_pull_req.setRequestHeader('Content-Type', 'application/json');
		remote_db_pull_req.send(JSON.stringify(delete_list)); 

	}); 
}

function local_db_delete(delete_list){
	return new Promise(async function (resolve) {
		delete_list.forEach(function(delete_data){
			db.files.delete(delete_data.path_name);
		});
		resolve();
	}); 
}

async function sync_remote_db(){
    
	var remote_db_check_req = new XMLHttpRequest();

    remote_db_check_req.onreadystatechange = async function(){
		if(this.readyState == 4 && this.status == 200){
			var local_db = await db.files.toArray();
			var local_db_list = local_db.map(function(row){
				return { "path_name" :row["path"], "last_modified":row["last_modified"] }
			});
			
			var remote_db_res = JSON.parse(this.responseText);

			var remote_db_last_modified = remote_db_res.last_modified;

			var local_db_last_modified = await db.settings.get("remote-indexed-last_modified");
			if(!remote_db_last_modified){
				remote_db_last_modified = local_db_last_modified;
			}
			else{
				remote_db_last_modified = Date.parse(remote_db_last_modified);
			}
			
			var check_list = JSON.parse(remote_db_res.list).map(function(row){
				return { "path_name" :row["path_name"], "last_modified":row["last_modified"] }
			});;
			
			var add_list = [];
			var updata_list = [];
			var local_delete = [];
			local_db_list.forEach(function(target) {	
				var filter_result = check_list.filter(function(file){
					if(file.path_name == target.path_name && Date.parse(target.last_modified) > Date.parse(file.last_modified)){
						updata_list.push(target);
					}
					return file.path_name == target.path_name;
				});
				if(!filter_result.length){
					if(remote_db_last_modified > Date.parse(target.last_modified)){
						local_delete.push(target);
					}
					else{
						add_list.push(target);
					}
				}	
			});

			var pull_list = [];
			var delete_list = [];
			check_list.forEach(function(target) {	
				var filter_result = local_db_list.filter(function(file){
					if(file.path_name == target.path_name && Date.parse(target.last_modified) > Date.parse(file.last_modified)){
						pull_list.push(target);
					}
					return file.path_name == target.path_name;
				});
				if(!filter_result.length){
					if(local_db_last_modified < Date.parse(target.last_modified)){
						pull_list.push(target);
					}
					else{
						delete_list.push(target);
					}
				}
				
			});
			
			var error_flag = false;
			var push_list = add_list.concat(updata_list);

			if(push_list.length){
				await remote_db_push(push_list);
			}
			if(pull_list.length){
				await remote_db_pull(pull_list);
			}
			if(delete_list.length){
				await remote_db_delete(delete_list);
			}
			if(local_delete.length){
				await local_db_delete(local_delete);
			}
			
			global_local_db = local_db_list;
			db.settings.put(new Date(),"remote-indexed-last_modified");
			now_sync = false;

			/*
			console.log(add_list);
			console.log(updata_list);
			console.log(pull_list);
			console.log(delete_list);
			console.log(local_delete);
			*/
		}
	}
    
	remote_db_check_req.open('post', "/api/update-check?ealps_sid=00a0000a&ealps_cid=TS0000", true);
	remote_db_check_req.setRequestHeader('Content-Type', 'application/json');
	remote_db_check_req.send(); 
    
}


function local_db_diff_check(){
	return new Promise(async function (resolve) {
		var local_db = await db.files.toArray();
		var local_db_list = local_db.map(function(row){
			return { "path_name" :row["path"], "last_modified":row["last_modified"] }
		});
		var old_db_list = global_local_db;

		
		local_db_list.forEach(function(target) {	
			var filter_result = old_db_list.filter(function(file){
				if(file.path_name == target.path_name && Date.parse(target.last_modified) > Date.parse(file.last_modified)){
					resolve(true);
				}
				return file.path_name == target.path_name;
			});
			if(!filter_result.length){
				resolve(true);
			}
		});

		old_db_list.forEach(function(target) {	
			var filter_result = local_db_list.filter(function(file){
				if(file.path_name == target.path_name && Date.parse(target.last_modified) > Date.parse(file.last_modified)){
					resolve(true);
				}
				return file.path_name == target.path_name;
			});
			if(!filter_result.length){
				resolve(true);
			}
		});

		resolve(false);
		
	}); 
}
