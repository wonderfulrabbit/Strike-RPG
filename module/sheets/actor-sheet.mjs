import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class StrikeActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["strikerpg", "sheet", "actor"],
      template: "systems/strikerpg/templates/actor/actor-sheet.html",
      width: 700,
      height: 700,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "details" }]
    });
  }

  /** @override */
  get template() {
    return `systems/strikerpg/templates/actor/actor-${this.actor.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = this.actor.data.toObject(false);

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData.data;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareItems(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();
    CONFIG.TinyMCE.content_css = "body { font-family:monospace,monospace;font-size:1em; }";
    

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    // Initialize containers.
    const gear = [];
    const skills = [];
    const tricks = [];
    const complications = [];
    const advancements = [];
    const flawfavors = [];
    const startingpowers = [];
    const classfeats = [];
    const classpowers = [];
    const rolefeats = [];
    const rolepowers = [];
    const feats = [];


    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || DEFAULT_TOKEN;
      // Append to gear.
      if (i.type === 'item') {
        gear.push(i);
      }
      // Append to features.
      else if (i.type === 'skill') {
        skills.push(i);
      }
      else if (i.type === 'trick') {
        tricks.push(i);
      }
      else if (i.type === 'complication') {
        complications.push(i);
      }
      else if (i.type === 'advancement') {
        advancements.push(i);
      }
      else if (i.type === 'flawfavor') {
        flawfavors.push(i);
      }
      // Append to spells.
      else if (i.type === 'startingpower') {
        startingpowers.push(i);
      }
      else if (i.type === 'classfeat') {
        classfeats.push(i);
      }
      else if (i.type === 'classpower') {
        classpowers.push(i);
      }
      else if (i.type === 'rolefeat') {
        rolefeats.push(i);
      }
      else if (i.type === 'rolepower') {
        rolepowers.push(i);
      }
      else if (i.type === 'feat') {
        feats.push(i);
      }
    }

    // Assign and return
    context.gear = gear;
    context.skills = skills;
    context.tricks = tricks;
    context.complications = complications;
    context.advancements = advancements;
    context.flawfavors = flawfavors;
    context.startingpowers = startingpowers;
    context.classfeats = classfeats;
    context.classpowers = classpowers;
    context.rolefeats = rolefeats;
    context.rolepowers = rolepowers;
    context.feats = feats;
   }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    html.find('.resetall').click(ev => {
      this.actor.update({"data.health.value": this.actor.data.data.health.max})
      this.actor.update({"data.strikes": 0})

      for (let p of this.actor.items){
        if (p.data.data.used == 1){
          const id = p.data._id;
          const item = this.actor.items.get(id);
          item.update({"data.usage": "Encounter"});
          item.update({"data.used": 0});
        }
      }            
    });

    html.find('.resetusage').click(ev => {
      const a = $(ev.currentTarget);
      const id = a[0].dataset.id;
      const power = this.actor.items.get(id);
      const u = power.data.data.used;

      if(power.data.data.usage != "Encounter" && power.data.data.usage != "<strike>Encounter</strike>") {
        return;
      }

      if (u == 0) {
        power.update({"data.usage": "<strike>Encounter</strike>"});
        power.update({"data.used": 1});
      }
      else {
        power.update({"data.usage": "Encounter"});
        power.update({"data.used": 0});
      }
            
    });

    html.find('.change-trick-uses').on('mousedown', ev => {
      const a = $(ev.currentTarget);
      const id = a[0].dataset.id;
      const trick = this.actor.items.get(id);
      const u = parseInt(trick.data.data.uses);

      if (ev.button == 0) {
        if (u >= 10) return;
        trick.update({"data.uses": u+1})
      }
      else if (ev.button == 2) {
        if (u <= 0) return;
        trick.update({"data.uses": u-1})
      }
            
    });

    html.find('.change-skill-uses').on('mousedown', ev => {
      
      const a = $(ev.currentTarget);
      const id = a[0].dataset.id;
      const trick = this.actor.items.get(id);
      const u = parseInt(trick.data.data.uses);

      if (ev.button == 0) {
        if (u >= 6) return;
        trick.update({"data.uses": u+1})
      }
      else if (ev.button == 2) {
        if (u <= 0) return;
        trick.update({"data.uses": u-1})
      }
            
    });

    html.find('.change-complication-uses').on('mousedown', ev => {
      const actor = this.actor;
      const u = parseInt(actor.data.data.complicationuses);

      if (ev.button == 0) {
        if (u >= 10) {
          actor.update({"data.complicationuses": 0});
        } 
        else {
          actor.update({"data.complicationuses": u+1});
        }
      }
      else if (ev.button == 2) {
        if (u <= 0) return;
        actor.update({"data.complicationuses": u-1})
      }
            
    });

    html.find('.toggle').click(ev => {
      const toggler = $(ev.currentTarget);
      const group = toggler.parents('.toggle-group');
      const description = group.next('.toggle-description');

      description.toggleClass('w3-hide');
    });

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    // Drag events for macros.
    if (this.actor.owner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.type;
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      img: "icons/skills/trades/academics-investigation-study-blue.webp",
      type: type,
      data: data
    };
    // Remove the type from the dataset since it's in the itemData.type prop.
    delete itemData.data["type"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle item rolls.
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
      if (dataset.rollType == 'power') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      }
    }

    // Handle rolls for initiative
    if (dataset.label=="initiative") {
      console.log("Rolling initiative")

      event.preventDefault();
      return this.actor.rollInitiative({createCombatants: true});
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[roll] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

}
