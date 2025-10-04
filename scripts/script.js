Math.clamp = (value, min, max) => {
    if (value < min) return min;
    if (value > max) return max;
    return value;
};


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}


function map(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}





const PROMPTKEYS = {

    'e': {
        released: [4, 2],
        pressed: [4, 9]
    }

}




function createLootingByLootName(name){

    const looting = LOOTING.find(e => e.name == name);

    if ( looting == null ){
        return null;
    }

    let count = (Math.random() < 0.1)? 0 : getRandomInt(1, looting.max_count+1);
    
    if ( count == 0 ){
        return [];
    }
    
    let generatedItems = [];
    let slotIndexList  = [];
    let totalWheight   = 0;

    looting.items.forEach(e => totalWheight += e.weight);

    while ( generatedItems.length < count ){

        let selectedWeight = getRandomInt(1, totalWheight+1);

        for (let i = 0; i < looting.items.length; i++){
            const item = looting.items[i];
            selectedWeight -= item.weight;

            if ( selectedWeight > 0 ){
                continue;
            }
            
            let index = getRandomInt(0, looting.max_slot);

            if ( !slotIndexList.includes(index) ){
                slotIndexList.push(index);
            }else{
                while ( slotIndexList.includes(index) ){
                    index = getRandomInt(0, looting.max_slot);
                }
            }

            generatedItems.push({
                name: item.name,
                qty: getRandomInt(item.min, item.max),
                index: index
            });
            
            break;

        }

    }

    return generatedItems;

}







function getFreeInventorySlotIndex(){
    let list = inventory_interface.querySelectorAll('.slot');

    for (let i = 0; i < list.length; i++){

        if ( list[i].firstElementChild == null ){
            return i;
        }
    }
    return -1;
}


function getUsedInventorySlotIndex(itemName = null){

    if ( itemName == null ){
        return -1;
    }

    let list = inventory_interface.querySelectorAll('.slot > .item');

    for (let i = 0; i < list.length; i++){

        if ( list[i].getAttribute("item-name") != itemName ){
            continue;
        }
        
        const CURRENT_VALUE = parseInt(list[i].innerHTML);
        const MAX_PACK = ITEMS.find(e => e.name == itemName).pack;

        if ( CURRENT_VALUE < MAX_PACK ){
            return Array.from(inventory_interface.querySelectorAll(".slot")).indexOf(list[i].parentElement);
        }
         
    }

    return -1;
}





function searchKeyByID( keyId ){
    let itemKey = inventory_interface.querySelector(`.slot > .item[item-name="key_01c"][key-id="${keyId}"]`);

    if ( itemKey == null ){
        return -1;
    }
    return Array.from(inventory_interface.querySelectorAll(".slot")).indexOf(itemKey.parentElement);
}


function hasKeyById( keyId ){
    let itemKey = inventory_interface.querySelector(`.slot > .item[item-name="key_01c"][key-id="${keyId}"]`);
    return itemKey != null;
}


function unlockChestById( chestId ){
    let chestElement = document.querySelector(`.chest[chest-id="${chestId}"]`);

    if ( chestElement != null ){
        chestElement.setAttribute('chest-locked', false);
    }
}

function useKeyById( keyId ){
    const index = searchKeyByID(keyId);

    if ( index >= 0 ){
        inventory_interface.querySelectorAll(".slot")[index].innerHTML = ''; 
        unlockChestById(keyId);
    }
}



    













var PLAYER_OBJECT = {
    canMove: true,
    canAnimate: true,
    speed: 2,
    position: {x: 0, y: 0}
};








    



var first_interact = true;

var tempSlot = document.getElementById("tempSlot");
var tooltip  = document.getElementById("tooltip");
var player   = document.getElementById("player");

var currentFrame = 0;
var delayFrames  = 0;

var currentMovementDirection = '';
var currentChestId           = null;

var AUDIO_AMBIENT_BUFFER = new Audio();
var ambiente_music_index = 0;

const ambiente_music_src = [
    "top_assets/ambient1.mp3",
    "top_assets/ambient2.mp3",
    "top_assets/ambient3.mp3"
];

const chest_close_src = [
    "top_assets/Chest_close1.ogg",
    "top_assets/Chest_close2.ogg",
    "top_assets/Chest_close3.ogg"
];

const chest_locked_src = [
    "top_assets/Door_open.ogg",
    "top_assets/Door_close.ogg"
];


AUDIO_AMBIENT_BUFFER.onloadeddata = () => {
    AUDIO_AMBIENT_BUFFER.play();
};

AUDIO_AMBIENT_BUFFER.onended = () => {
    ambiente_music_index = (ambiente_music_index + 1) % ambiente_music_src.length;
    AUDIO_AMBIENT_BUFFER.src = ambiente_music_src[ambiente_music_index];
    AUDIO_AMBIENT_BUFFER.load();
};


document.body.addEventListener('mousedown',() => {
    if ( first_interact ){
        AUDIO_AMBIENT_BUFFER.src = ambiente_music_src[ambiente_music_index];
        first_interact = false;
    }
});




onmousemove = (event) => {
    tempSlot.style.left      = (event.clientX - tempSlot.offsetWidth/2) + "px";
    tempSlot.style.top       = (event.clientY - tempSlot.offsetHeight/2) + "px";
    tooltip.style.left       = (event.clientX + 16) + "px";
    tooltip.style.top        = (event.clientY - tempSlot.offsetHeight) + "px";
    tooltip.style.visibility = 'hidden';

    if (event.target.classList.contains("item") && tempSlot.firstElementChild == null){
        tooltip.style.visibility = 'visible';
        tooltip.innerHTML = ITEMS.find(e => e.name == event.target.getAttribute("item-name")).label;
    }

};





function toggleInventory(state = false){
    chest_interface.style.display = 'none';
    game_interface.classList.toggle('interface_open', state);
}


function toggleChest(state = false){
    chest_interface.style.display = '';
    game_interface.classList.toggle('interface_open', state);

    if ( state ){
        new Audio("top_assets/Chest_open.ogg").play();
        setChestState((checkChestEmpty())? 1 : 2);
        return;
    }
    setChestState(0);
    new Audio(chest_close_src[getRandomInt(0, chest_close_src.length)]).play();
}



function setChestState(state = 0){
    let chestElement = document.querySelector(`.chest[chest-id="${currentChestId}"]`);

    if ( chestElement != null ){
        chestElement.style.backgroundPositionX = `calc(-100% * ${state})`;
    }
}



function checkChestEmpty(){
    if ( currentChestId == null ){
        return null;
    }
    return document.querySelector(`.chest[chest-id="${currentChestId}"] .chest_item`) == null;
}






document.querySelectorAll(".slot").forEach(slot => {

    slot.onmousedown = (event) => {

        const tempSlotFree = tempSlot.firstElementChild == null;
        const slotFree     = slot.firstElementChild == null;
        let tempSlotQty    = (tempSlotFree)? 0 : parseInt(tempSlot.firstElementChild.innerHTML);
        let slotQty        = (slotFree)? 0 : parseInt(slot.firstElementChild.innerHTML);

        // LEFT BUTTON
        if ( event.button == 0 ){

            if ( tempSlotFree && !slotFree ){
                tempSlot.appendChild(slot.firstElementChild);
            }

            else if ( !tempSlotFree && slotFree ){
                slot.appendChild(tempSlot.firstElementChild);
            }
            
            else if ( !tempSlotFree && !slotFree ){
                if ( tempSlot.firstElementChild.getAttribute("item-name") == slot.firstElementChild.getAttribute("item-name") ){
                    const item = ITEMS.find(e => e.name == slot.firstElementChild.getAttribute("item-name"));

                    if ( tempSlotQty + slotQty <= item.pack ){
                        tempSlot.innerHTML = '';
                        slot.firstElementChild.innerHTML = tempSlotQty + slotQty;
                    }else{
                        tempSlotQty -= item.pack - slotQty;
                        tempSlot.firstElementChild.innerHTML = tempSlotQty;
                        slot.firstElementChild.innerHTML = item.pack;
                    }
                }else{
                    tempSlot.appendChild(slot.firstElementChild);
                    slot.appendChild(tempSlot.firstElementChild);
                }
            }

        }
        

        // RIGHT BUTTON
        else if ( event.button == 2 ){

            if ( tempSlotFree && !slotFree ){
                if ( slotQty > 1 ){
                    let cloned = slot.firstElementChild.cloneNode(true);
                    slot.firstElementChild.innerHTML = parseInt( slotQty / 2 );
                    cloned.innerHTML = slotQty - parseInt(slot.firstElementChild.innerHTML);
                    tempSlot.appendChild(cloned);
                }else{
                    tempSlot.appendChild(slot.firstElementChild);
                }
            }
            
            else if ( !tempSlotFree && slotFree ){
                let cloned = tempSlot.firstElementChild.cloneNode(true);
                cloned.innerHTML = 1;
                slot.appendChild(cloned);
                if ( tempSlotQty - 1 <= 0 ){
                    tempSlot.innerHTML = '';
                }else{
                    tempSlot.firstElementChild.innerHTML = tempSlotQty - 1;
                }
            }
            
            else if ( !tempSlotFree && !slotFree ){
                if ( tempSlot.firstElementChild.getAttribute("item-name") == slot.firstElementChild.getAttribute("item-name") ){
                    const item = ITEMS.find(e => e.name == slot.firstElementChild.getAttribute("item-name"));
                    if ( slotQty + 1 <= item.pack ){ 
                        slot.firstElementChild.innerHTML = slotQty + 1;
                        if ( tempSlotQty - 1 <= 0 ){
                            tempSlot.innerHTML = '';
                        }else{
                            tempSlot.firstElementChild.innerHTML = tempSlotQty - 1;
                        }
                    }
                }else{
                    tempSlot.appendChild(slot.firstElementChild);
                    slot.appendChild(tempSlot.firstElementChild);
                }
            }

        }

        
        // UPDATE CHEST
        if ( slot.parentElement.parentElement.id == 'chest_interface' ){
            
            let chestElement = document.querySelector(`.chest[chest-id="${currentChestId}"]`);
            chestElement.querySelector(".chest_items").innerHTML = '';

            chest_interface.querySelectorAll('.slot').forEach((chestSlot, chestSlotIndex) => {
                
                if ( chestSlot.firstElementChild != null ){
                    let chest_item = document.createElement("div");
                    chest_item.classList.add("chest_item");
                    chest_item.setAttribute("slot-index", chestSlotIndex);
                    chest_item.setAttribute("item-name", chestSlot.firstElementChild.getAttribute("item-name"));
                    chest_item.setAttribute("qty", chestSlot.firstElementChild.innerHTML);
                    chestElement.querySelector(".chest_items").appendChild(chest_item);
                }

            });

            setChestState((checkChestEmpty())? 1 : 2);

        }


    };

});





















onkeydown = onkeyup = (event) => {
    if ( movementController[event.key] ){
        movementController[event.key].pressed = event.type == 'keydown';
    }

    if ( event.type == "keyup" ){
        if ( PLAYER_ANIMATION[currentMovementDirection] ){
            currentFrame = PLAYER_ANIMATION[currentMovementDirection].default;
            player.style.backgroundPosition = `${-42 * PLAYER_ANIMATION[currentMovementDirection].animation[currentFrame][0]}px ${-52 * PLAYER_ANIMATION[currentMovementDirection].animation[currentFrame][1]}px`;
        }
        currentMovementDirection = '';
    }
    

    if ( event.type == 'keydown' && !event.repeat ){
        if ( event.key == 'e' ){
            if ( currentChestId == null ){
                toggleInventory( !game_interface.classList.contains('interface_open') );
            }else{

                let chestElement = document.querySelector(`.chest[chest-id="${currentChestId}"]`);

                if ( chestElement.getAttribute('chest-locked') == 'true' ){
                    const chestId = chestElement.getAttribute('chest-id');
                    if ( hasKeyById(chestId) ){
                        useKeyById(chestId);
                    }else{
                        new Audio(chest_locked_src[getRandomInt(0, chest_locked_src.length)]).play();
                    }
                }

                
                if ( chestElement.getAttribute('chest-locked') == 'false' ){
                    document.querySelectorAll("#chest_interface .slot > .item").forEach(e => e.remove());

                    if ( chestElement.getAttribute("generate-loot") == "true" ){
                        chestElement.setAttribute("generate-loot", false);
                        const looting = createLootingByLootName("chest");
                        looting.forEach(itemChest => {
                            let item = document.createElement("div");
                            item.classList.add("chest_item");
                            item.setAttribute("slot-index", itemChest.index);
                            item.setAttribute("item-name", itemChest.name);
                            item.setAttribute("qty", itemChest.qty);
                            chestElement.querySelector(".chest_items").appendChild(item);
                        });
                    }

                    chestElement.querySelectorAll(".chest_item").forEach(itemChest => {
                        const index = parseInt(itemChest.getAttribute("slot-index"));
                        const itemObject = ITEMS.find(e => e.name == itemChest.getAttribute("item-name"));
                        let item = document.createElement("div");
                        item.classList.add("item");
                        item.setAttribute("item-name", itemObject.name);
                        item.innerHTML = itemChest.getAttribute("qty"); 
                        item.style.backgroundImage = `url("top_assets/items/${itemObject.icon}")`;
                        document.querySelectorAll("#chest_interface .slot")[index].appendChild(item);
                    });
                    
                    toggleChest( !game_interface.classList.contains('interface_open') );

                }

            }
        }
    }
};



onblur = () => {
    Object.keys(movementController).forEach(e => {
        movementController[e].pressed = false;
        currentMovementDirection = '';
    });
};







var promptkeyDelay = -1;
var promptkeyFrame = 0; 


function update(){

    const movementControllerNames = Object.keys(movementController);
    
    if ( !game_interface.classList.contains('interface_open') ){

        for (let i = 0; i < movementControllerNames.length; i++){
            
            if ( !movementController[movementControllerNames[i]].pressed && movementControllerNames[i] == "Shift" ){
                PLAYER_OBJECT.speed = 2;
                continue;
            }
            
            if ( !movementController[movementControllerNames[i]].pressed ){
                continue;
            }

            currentMovementDirection = movementControllerNames[i];
            movementController[currentMovementDirection].call();

            if ( currentMovementDirection == "Shift" ){
                continue;
            }
            

            if ( !PLAYER_OBJECT.canAnimate ){
                currentFrame = PLAYER_ANIMATION[currentMovementDirection].default;
            }
            else if ( ++delayFrames >= ((PLAYER_OBJECT.speed == 2)? 10 : 5) ){
                delayFrames = 0;
                currentFrame = (currentFrame + 1) % PLAYER_ANIMATION[currentMovementDirection].animation.length;
            }

            player.style.backgroundPosition = `${-42 * PLAYER_ANIMATION[currentMovementDirection].animation[currentFrame][0]}px ${-52 * PLAYER_ANIMATION[currentMovementDirection].animation[currentFrame][1]}px`;
            break;
            
        }

    }


    PLAYER_OBJECT.canAnimate = true;
    currentChestId = null;


    // COLLECTABLE ITEMS
    document.querySelectorAll(".collectable").forEach(collectable => {
        
        collision = PLAYER_OBJECT.position.x + player.offsetWidth > collectable.offsetLeft
                    && PLAYER_OBJECT.position.y + player.offsetHeight > collectable.offsetTop
                    && collectable.offsetLeft + collectable.offsetWidth > PLAYER_OBJECT.position.x 
                    && collectable.offsetTop + collectable.offsetHeight > PLAYER_OBJECT.position.y;

        
        if ( collision ){

            const itemObject = ITEMS.find(e => e.name == collectable.getAttribute("item-name") );
            let list = inventory_interface.querySelectorAll('.slot');


            const usedSlot = getUsedInventorySlotIndex(itemObject.name);
            
            // PEGAR O ITEM E JUNTAR COM UM SLOT DO MESMO TIPO
            if ( usedSlot >= 0 ){

                let collectable_qty = parseInt(collectable.getAttribute("qty"));
                let slot_qty = parseInt(list[usedSlot].firstElementChild.innerHTML);

                if ( collectable_qty + slot_qty <= itemObject.pack ){
                    list[usedSlot].firstElementChild.innerHTML = collectable_qty + slot_qty;
                    collectable.remove();
                }else{
                    collectable_qty -= itemObject.pack - slot_qty;
                    list[usedSlot].firstElementChild.innerHTML = itemObject.pack;
                    collectable.setAttribute("qty", collectable_qty);
                }
                new Audio("top_assets/Colect.ogg").play();

                return;
                    
            }


            const freeSlot = getFreeInventorySlotIndex();

            // PEGAR O ITEM E COLOCAR NO SLOT LIVRE
            if ( freeSlot >= 0 ){
                let item = document.createElement('div');
                item.classList.add("item");
                item.setAttribute("item-name", itemObject.name);

                if ( collectable.hasAttribute('key-id') ){
                    item.setAttribute("key-id", collectable.getAttribute('key-id'));
                }

                item.innerHTML = collectable.getAttribute("qty");
                item.style.backgroundImage = `url("top_assets/items/${itemObject.icon}")`; 
                list[freeSlot].appendChild(item);

                collectable.remove();
                new Audio("top_assets/Colect.ogg").play();
            }

        }


    });





    
    

    // MOVEABLE
    document.querySelectorAll(".moveable").forEach(moveable => {

        collision = PLAYER_OBJECT.position.x + player.offsetWidth > moveable.offsetLeft
                    && PLAYER_OBJECT.position.y + player.offsetHeight > moveable.offsetTop
                    && moveable.offsetLeft + moveable.offsetWidth > PLAYER_OBJECT.position.x 
                    && moveable.offsetTop + moveable.offsetHeight > PLAYER_OBJECT.position.y;


        let moveable_position = {
            x: moveable.offsetLeft,
            y: moveable.offsetTop
        };

        if ( collision ){
            
            switch (currentMovementDirection) {
                case "ArrowRight":
                    moveable_position.x = ( PLAYER_OBJECT.position.x + player.offsetWidth );
                    break;
                case "ArrowLeft":
                    moveable_position.x = ( PLAYER_OBJECT.position.x - moveable.offsetWidth );
                    break;
                case "ArrowDown":
                    moveable_position.y = ( PLAYER_OBJECT.position.y + player.offsetHeight );
                    break;
                case "ArrowUp":
                    moveable_position.y = ( PLAYER_OBJECT.position.y - moveable.offsetHeight );
                    break;
            }
            

            document.querySelectorAll(".rigid, .moveable").forEach(rigid => {

                if ( moveable == rigid ){
                    return true;
                }
                
                const moveable_collision = moveable_position.x + moveable.offsetWidth > rigid.offsetLeft &&
                moveable_position.y + moveable.offsetHeight > rigid.offsetTop &&
                rigid.offsetLeft + rigid.offsetWidth > moveable_position.x &&
                rigid.offsetTop + rigid.offsetHeight > moveable_position.y;
                
                if ( moveable_collision ){
                    // console.log("PASS");
                    PLAYER_OBJECT.canAnimate = false;


                    switch (currentMovementDirection) {
                        case "ArrowRight":
                            moveable_position.x = rigid.offsetLeft - moveable.offsetWidth;
                            PLAYER_OBJECT.position.x = moveable_position.x - player.offsetWidth;
                            break;
                        case "ArrowLeft":
                            moveable_position.x = rigid.offsetLeft + rigid.offsetWidth;
                            PLAYER_OBJECT.position.x = moveable_position.x + moveable.offsetWidth;
                            break;
                        case "ArrowDown":
                            moveable_position.y = rigid.offsetTop - moveable.offsetHeight;
                            PLAYER_OBJECT.position.y = moveable_position.y - player.offsetHeight;
                            break;
                        case "ArrowUp":
                            moveable_position.y = rigid.offsetTop + rigid.offsetHeight;
                            PLAYER_OBJECT.position.y = moveable_position.y + moveable.offsetHeight;
                            break;
                    }

                }

            });

            moveable.style.left = moveable_position.x + "px";
            moveable.style.top  = moveable_position.y + "px";

        }

    });








    // CHEST
    Array.from(document.querySelectorAll(".chest")).forEach(chest => {

        let collisionArea = player.offsetLeft + player.offsetWidth + 26 > chest.offsetLeft
                            && player.offsetTop + player.offsetHeight + 26 > chest.offsetTop
                            && chest.offsetLeft + chest.offsetWidth + 26 > player.offsetLeft
                            && chest.offsetTop + chest.offsetHeight + 26 > player.offsetTop;

        let collision = false;

        const promptkeyName = chest.querySelector(".promptkey").getAttribute('prompt');

        if ( collisionArea ){

            currentChestId = chest.getAttribute("chest-id");

            collision = PLAYER_OBJECT.position.x + player.offsetWidth > chest.offsetLeft
                        && PLAYER_OBJECT.position.y + player.offsetHeight > chest.offsetTop
                        && chest.offsetLeft + chest.offsetWidth > PLAYER_OBJECT.position.x 
                        && chest.offsetTop + chest.offsetHeight > PLAYER_OBJECT.position.y;
            
            if ( collision ){
                // console.log("COLLISION");

                switch (currentMovementDirection) {
                    case "ArrowRight":
                        PLAYER_OBJECT.position.x = Math.clamp(PLAYER_OBJECT.position.x, 0, chest.offsetLeft - player.offsetWidth);
                        break;
                    case "ArrowLeft":
                        PLAYER_OBJECT.position.x = Math.clamp(PLAYER_OBJECT.position.x, chest.offsetLeft + chest.offsetWidth, 0);
                        break;
                    case "ArrowDown":
                        PLAYER_OBJECT.position.y = Math.clamp(PLAYER_OBJECT.position.y, 0, chest.offsetTop - player.offsetHeight);
                        break;
                    case "ArrowUp":
                        PLAYER_OBJECT.position.y = Math.clamp(PLAYER_OBJECT.position.y, chest.offsetTop + chest.offsetHeight, 0);
                        break;
                }

                currentMovementDirection = '';
                PLAYER_OBJECT.canAnimate = false;

            }

            if ( promptkeyFrame == 0 || promptkeyDelay == -1 ){
                chest.querySelector(".promptkey").style.backgroundPosition = `${-16 * PROMPTKEYS[promptkeyName].released[0]}px ${-16 * PROMPTKEYS[promptkeyName].released[1]}px`;
            }else{
                chest.querySelector(".promptkey").style.backgroundPosition = `${-16 * PROMPTKEYS[promptkeyName].pressed[0]}px ${-16 * PROMPTKEYS[promptkeyName].pressed[1]}px`;
            }

            if ( ++promptkeyDelay >= 10){
                promptkeyDelay = 0;
                promptkeyFrame = (promptkeyFrame + 1) % 2;
            }

        }

        chest.querySelector(".promptkey").style.display = ( collisionArea && !game_interface.classList.contains('interface_open') )? 'block' : '';

    });
    



    if ( PLAYER_OBJECT.position.x < 0 || PLAYER_OBJECT.position.x > main_screen.offsetWidth - player.offsetWidth || PLAYER_OBJECT.position.y < 0 || PLAYER_OBJECT.position.y > main_screen.offsetHeight - player.offsetHeight ){
        PLAYER_OBJECT.canAnimate = false;
    }
    
    PLAYER_OBJECT.position.x = Math.clamp(PLAYER_OBJECT.position.x, 0, main_screen.offsetWidth - player.offsetWidth);
    PLAYER_OBJECT.position.y = Math.clamp(PLAYER_OBJECT.position.y, 0, main_screen.offsetHeight - player.offsetHeight);
    
    player.style.left = (PLAYER_OBJECT.position.x) + "px";
    player.style.top = (PLAYER_OBJECT.position.y) + "px";

    requestAnimationFrame(update);

}




onload = update;