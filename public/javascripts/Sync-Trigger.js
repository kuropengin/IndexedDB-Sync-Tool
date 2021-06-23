const trigger_key_list = {
    "simple":[],
    "ctrl":["s"],
    "shift":[],
    "alt":[]

}


var trigger_init_check = false;

function trigger_init(){

    if(!trigger_init_check){
        //keybind_init();
        observe_init();
        trigger_init_check = true;
    }
    
}


function observe_init(){

    var count = 0;
    const gtelsment = function(){
        var element = document.getElementById("editor").contentWindow.document.getElementsByClassName("jp-DirListing-content")[0];
        if(!element){
            count += 1;
            if(count <= 5){
                setTimeout(gtelsment, 1000);
            }
        }
        else{
            var mo = new MutationObserver(async function(record, observer) {
                if(await local_db_diff_check()){
                    if(!now_sync){
                        console.log("sync!!");
                        db.settings.put(new Date(),"remote-indexed-last_modified");
                        init();
                    }
                }
            });
        
            var config = {
                childList: true,
                attributes: true,
                subtree: true,
                attributeFilter: ["li","title"]
            };
            mo.observe(element, config);
        }
    } 
    gtelsment();

}

async function keybind_init(){

    var count = 0;
    const gtelsment = function(){
        var element = document.getElementById("editor").contentWindow.document;
        if(!element){
            count += 1;
            if(count <= 5){
                setTimeout(gtelsment, 1000);
            }
        }
        else{
            element.addEventListener('keydown', function (event) {
                if (event.keyCode === 83 && (event.ctrlKey || event.metaKey)) {
                    sync_remote_db();
                }
                if (event.keyCode === 13 && (event.shiftKey || event.metaKey)) {
                    
                }
            },true);
        }
    }
    await sleep(2000);
    gtelsment();
}

