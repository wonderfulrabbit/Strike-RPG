/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class StrikeItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
   getRollData() {
    // If present, return the actor's roll data.
    if ( !this.actor ) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.data.data);

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this.data;

    // Initialize chat data.
    if (this.data.data.used != 0) {
      return ui.notifications.warn('Encounter has been used already.');
    }


    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    let type = (item.type).toUpperCase();
    
    let bordered = '';

    let message = `
      <div class="w3-tiny w3-center w3-border-bottom w3-border-black">`+type+`</div>
      <div class="w3-large w3-center">
        ${item.name}
      </div>`;

    if (type == 'ROLEPOWER' || type =='CLASSPOWER') {
      if (this.data.data.usage == 'Encounter'){
        this.update({"data.used": 1});
        this.update({"data.usage": '<strike>'+this.data.data.usage+'</strike'});
      }

      message += `
      <div class="w3-center w3-padding">
        <div class="w3-tag w3-round-small w3-red w3-center w3-centered" data-id="{{item._id}}">
          Level ${item.data.level}
        </div>
        <div class="w3-tag w3-round-small w3-red w3-center w3-centered" data-id="{{item._id}}">
          ${item.data.type}
        </div>
        <div class="w3-tag w3-round-small w3-red w3-center w3-centered" data-id="{{item._id}}">
          ${item.data.usage}
        </div>
      </div>`;

      message += `
      <div class="w3-center">
        <div class="w3-tag w3-round-small w3-red w3-center w3-centered" data-id="{{item._id}}">
          ${item.data.range}
        </div>`;

      if (item.data.damage != null) {
        message += `
        <div class="w3-tag w3-round-small w3-red w3-center">
          ${item.data.damage}
          <i class="fas fa-heart"></i>
        </div>`
      }

      message += `</div>`;
    } 

    message += `<div class="w3-col">${item.data.description}</div>`;

    // If there's no roll data, send a chat message.
    if (!this.data.data.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        content: message ?? ''
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.item.formula, rollData);
      // If you need to store the value first, uncomment the next line.
      // let result = await roll.roll({async: true});
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }
}
