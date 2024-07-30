import { Connection, Player } from "bedrock-protocol";
import { Vector2, Vector3 } from "./math";
import { CommandManager, CommandManager } from "./command";
import {EventEmitter} from "events"
import {getLogger,Logger } from "log4js";
declare export type Vector3Like = { x: number, y: number, z: number } | Vector3;
declare export type Vector2Like = { x: number, z: number } | Vector2;
declare export type GameMode = "survival" | "creative" | "adventure" | "survival_spectator" | "creative_spectator" | "fallback" | "spectator";
declare export type GameRule = {
    name: string,
    editable: boolean,
    type: "bool" | "int" | "float",
    value: boolean | number | number
};
declare export type UUID = string;
declare export type NetworkPlayer = any;
declare export type RuntimeId = BigInt | Number;
declare export type Item = {
    network_id: number;
    count: number;
    metadata: number;
    has_stack_id: number;
    stack_id: number | undefined;
    block_runtime_id: RuntimeId;
};
declare export type EntityPlayer = {
    uuid: UUID;
    username: string;
    runtime_id: RuntimeId;
    platform_chat_id: string;
    position: Vector3Like;
    velocity: Vector3Like;
    pitch: Number;
    yaw: Number;
    head_yaw: Number;
    held_item: Item;
    gamemode: GameMode;
    metadata: object;
    properties: object;
    unique_id: RuntimeId;
    permission_level: "visitor" | "member" | "operator" | "custom";
    command_permission: "normal" | "operator" | "automation" | "host" | "owner" | "internal";
    links: any;
    device_id: string;
    device_os: "Undefined" | "Android" | "IOS" | "OSX" | "FireOS" | "GearVR" | "Hololens" | "Win10" | "Win32" | "Dedicated" | "TVOS" | "Orbis" | "NintendoSwitch" | "Xbox" | "WindowsPhone" | "Linux";
};
declare export type GameData = {
    entity_id: undefined | bigint;
    runtime_entity_id: undefined | bigint;
    player_gamemode: undefined | GameMode;
    player_position: undefined | Vector3Like;
    rotation: undefined | Vector2Like;
    seed: undefined | number | bigint;
    biome_type: undefined | any;
    biome_name: undefined | any;
    dimension: undefined | string | "overworld" | "nether" | "end";
    generator: undefined | any;
    world_gamemode: undefined | GameMode;
    difficulty: undefined | number;
    spawn_position: undefined | Vector3Like;
    achievements_disabled: undefined | boolean;
    editor_world_type: undefined | any;
    created_in_editor: undefined | any;
    exported_from_editor: undefined | any;
    day_cycle_stop_time: undefined | any;
    edu_offer: undefined | any;
    edu_features_enabled: undefined | any;
    edu_product_uuid: undefined | any;
    rain_level: undefined | any;
    lightning_level: undefined | any;
    has_confirmed_platform_locked_content: undefined | any;
    is_multiplayer: undefined | boolean;
    broadcast_to_lan: undefined | any;
    xbox_live_broadcast_mode: undefined | any;
    platform_broadcast_mode: undefined | any;
    enable_commands: undefined | any;
    is_texturepacks_required: undefined | any;
    gamerules: undefined | GameRule[];
    experiments: undefined | any;
    experiments_previously_used: undefined | any;
    bonus_chest: undefined | any;
    map_enabled: undefined | any;
    permission_level: undefined | any;
    server_chunk_tick_range: undefined | any;
    has_locked_behavior_pack: undefined | any;
    has_locked_resource_pack: undefined | any;
    is_from_locked_world_template: undefined | any;
    msa_gamertags_only: undefined | any;
    is_from_world_template: undefined | any;
    is_world_template_option_locked: undefined | any;
    only_spawn_v1_villagers: undefined | any;
    persona_disabled: undefined | any;
    custom_skins_disabled: undefined | any;
    emote_chat_muted: undefined | any;
    game_version: undefined | string;
    limited_world_width: undefined | number;
    limited_world_length: undefined | number;
    is_new_nether: undefined | boolean;
    edu_resource_uri: undefined | any;
    experimental_gameplay_override: undefined | any;
    chat_restriction_level: undefined | any;
    disable_player_interactions: undefined | any;
    level_id: undefined | string;
    world_name: undefined | string;
    premium_world_template_id: undefined | any;
    is_trial: undefined | any;
    movement_authority: undefined | any;
    rewind_history_size: undefined | any;
    server_authoritative_block_breaking: undefined | any;
    current_tick: undefined | number;
    enchantment_seed: undefined | any;
    block_properties: undefined | any;
    itemstates: undefined | any;
    multiplayer_correlation_id: undefined | any;
    server_authoritative_inventory: undefined | any;
    engine: undefined | any;
    property_data: undefined | any;
    block_pallette_checksum: undefined | any;
    world_template_id: undefined | any;
    client_side_generation: undefined | any;
    block_network_ids_are_hashes: undefined | any;
    server_controlled_sound: undefined | any;

    selected_item: { network_id: number };
    selected_slot: number;
    is_sneaking: boolean;
    is_sprinting: boolean
};
declare export let CommandManager: CommandManager;
declare export type CreeperRelayContext = {
    client:{
        getGameData(): GameData;
        sendMessage(...text: any[]): void;
        showMessage(...text: any[]): void;
        playerByName(name: string): void;
        sendToast(title: string, text: string): void;
        runCommand(command: string): void;
        tp(pos: Vector3Like): void;
        disconnect(): void;
        interact(): void;
        hitBlock(pos: Vector3Like): void;
        swing(): void;
        players: Record<UUID, NetworkPlayer>;
        entityPlayers: Record<number | bigint, EntityPlayer>;
        events:EventEmitter<{"spawn","disconnect","tick"}>;
        connection:Connection;
};
config:{
    getConfig<T extends Record>(fp:string,defaultConfig:T):T;
}
commandManager:CommandManager;
getLogger():Logger;
language:typeof import("./lang"),
camera:typeof import("./camera")
}