// Define imports
import isaacScriptInit from "./isaacScriptInit";

// Initialize some IsaacScript-specific functions
isaacScriptInit();

// Helpers
function clamp(num: number, min: number, max: number) {
    return num <= min ? min : num >= max ? max : num;
}

// Register the mod
// (which will make it show up in the list of mods on the mod screen in the main menu)
const damageNumbersIs = RegisterMod("damageNumbersIs", 1);
const DAMAGE_DURATION = 1000;
const DAMAGE_X_OFFSET = 10;
const DAMAGE_Y_OFFSET = -50;
const f = Font();
f.Load("font/pftempestasevencondensed.fnt");

let sprite = Sprite()
sprite.Load("gfx/health_bar.anm2", true)
sprite.SetAnimation("Bar") 

type DamageIndicator = {
    position: Vector;
    amount: float;
    timeLeft: int;
    color: KColor;
};

let indicatorArray: DamageIndicator[] = [];

// Define callback functions
function onNPCRender(npc: EntityNPC, _rO: Vector) {
    if (npc && npc.Visible && npc.IsActiveEnemy(false) && npc.HitPoints > 0 && !npc.IsInvincible() && !npc.IsBoss()) {
        let frame = (npc.HitPoints / npc.MaxHitPoints) * 10;
        let pos = Isaac.WorldToScreen(npc.Position);
        pos.Y += npc.Size / 2;

        sprite.SetFrame(0)
        sprite.SetOverlayFrame("BarFull", math.ceil(frame))
        sprite.Render(pos, Vector(0, 0), Vector(0, 0))
    }
}

let lastTime = Isaac.GetTime();
function onRender() {
    const curTime = Isaac.GetTime();
    const delta = curTime - lastTime;

    indicatorArray.forEach((dmg) => {
        const screenPos = Isaac.WorldToScreen(dmg.position);

        // Get percentage that we are through the animation
        let timeRatio = 1 - dmg.timeLeft / DAMAGE_DURATION;
        timeRatio = clamp(timeRatio, 0, 1);

        // Horizontal movement
        const timeRatioPi = timeRatio * math.pi * 2;
        let labelX = screenPos.X + DAMAGE_X_OFFSET * math.sin(timeRatioPi);

        // Vertical movement
        const labelY = screenPos.Y + DAMAGE_Y_OFFSET * timeRatio - 25;

        // Smooth out
        let alpha = 1.0;
        if (timeRatio >= 0.8) {
            alpha = (1 - timeRatio) * 5;
            alpha = clamp(alpha, 0, 1.0);
        }

        dmg.color.Alpha = alpha;

        // Calculate label
        const damageLabel = string.format("%.2f", dmg.amount);
        const damageLabelWidth = f.GetStringWidth(damageLabel);
        labelX = labelX - damageLabelWidth / 2;

        f.DrawString(damageLabel, labelX, labelY, dmg.color, damageLabelWidth, true);

        // Reduce the time on the damage
        dmg.timeLeft -= delta;
    });

    indicatorArray = indicatorArray.filter((dmg) => {
        return dmg.timeLeft > 0;
    });

    lastTime = curTime;
}

function onEntityDamaged(target: Entity, amount: number, _f: DamageFlag, _s: EntityRef, _cF: number): boolean | null {
    if (target && target.ToNPC() && target.IsActiveEnemy(false) && target.IsVulnerableEnemy()) {
		let targetNPC = target.ToNPC()!;
		if (target.Type == EntityType.ENTITY_PIN && targetNPC.ParentNPC && targetNPC.ParentNPC.Visible) {
			return null;
		}

        // Draw the label
        let color = KColor(184 / 255, 70 / 255, 70 / 255, 1.0);

        if (indicatorArray.length < 50 && amount > 0) {
			indicatorArray.push({
				position: target.Position,
				amount: amount,
				timeLeft: DAMAGE_DURATION,
                color: color
			});
		}
    }

    return null;
}

// Register callbacks
damageNumbersIs.AddCallback(ModCallbacks.MC_ENTITY_TAKE_DMG, onEntityDamaged);
damageNumbersIs.AddCallback(ModCallbacks.MC_POST_RENDER, onRender);
damageNumbersIs.AddCallback(ModCallbacks.MC_POST_NPC_RENDER, onNPCRender);

// Print an initialization message to the "log.txt" file
Isaac.DebugString("damage_numbers_is initialized.");
print("damage_numbers_is initialized.")
