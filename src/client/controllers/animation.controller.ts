import { Controller, OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";
import { Logger } from "shared/logger";

interface AnimationOptions {
    key: string;
    animationId: string | number;
    priority?: Enum.AnimationPriority;
    looped?: boolean;
    speed?: number;
    fadeTime?: number;
}

interface PreloadOptions {
    key: string;
    animationId: string | number;
}

@Controller()
export class AnimationController implements OnStart {
    private animator?: Animator;
    private humanoid?: Humanoid;
    private preloadedAnimations = new Map<string, AnimationTrack>();
    private playingAnimations = new Map<string, AnimationTrack>();

    constructor(private logger: Logger) {}

    onStart(): void {
        const player = Players.LocalPlayer;
        
        const character = player.Character || player.CharacterAdded.Wait()[0];
        this.setupCharacter(character);
        
        player.CharacterAdded.Connect((char) => {
            this.setupCharacter(char);
        });
    }

    private setupCharacter(character: Model): void {
        const humanoid = character.WaitForChild("Humanoid") as Humanoid;
        this.humanoid = humanoid;
        
        let animator = humanoid.FindFirstChildOfClass("Animator");
        if (!animator) {
            animator = new Instance("Animator");
            animator.Parent = humanoid;
        }
        this.animator = animator;
        
        // Clear maps when character respawns
        this.preloadedAnimations.clear();
        this.playingAnimations.clear();
    }

    public preload(options: PreloadOptions): AnimationTrack | undefined {
        if (!this.animator) {
            this.logger.warn("Animator not initialized");
            return undefined;
        }

        // Check if already preloaded
        if (this.preloadedAnimations.has(options.key)) {
            return this.preloadedAnimations.get(options.key);
        }

        // Create and load animation
        const animation = new Instance("Animation");
        const animationId = typeIs(options.animationId, "number") 
            ? `rbxassetid://${options.animationId}` 
            : options.animationId;
        animation.AnimationId = animationId;

        const animationTrack = this.animator.LoadAnimation(animation);
        this.preloadedAnimations.set(options.key, animationTrack);
        this.logger.log(`preloaded: ${options.key}, id: ${options.animationId}`)
        return animationTrack;
    }

    public play(options: AnimationOptions): AnimationTrack | undefined {
        if (!this.animator) {
            this.logger.warn("Animator not initialized");
            return undefined;
        }

        // Stop existing animation with the same key if exists
        const existingTrack = this.playingAnimations.get(options.key);
        if (existingTrack && existingTrack.IsPlaying) {
            existingTrack.Stop(options.fadeTime);
        }

        // Check if animation is preloaded
        let animationTrack = this.preloadedAnimations.get(options.key);
        
        if (!animationTrack) {
            // Create and load animation if not preloaded
            const animation = new Instance("Animation");
            const animationId = typeIs(options.animationId, "number") 
                ? `rbxassetid://${options.animationId}` 
                : options.animationId;
            animation.AnimationId = animationId;

            animationTrack = this.animator.LoadAnimation(animation);
        }

        // Set properties
        if (options.priority !== undefined) {
            animationTrack.Priority = options.priority;
        }
        if (options.looped !== undefined) {
            animationTrack.Looped = options.looped;
        }

        // Play animation
        animationTrack.Play(options.fadeTime);

        // Set speed after playing
        if (options.speed !== undefined) {
            animationTrack.AdjustSpeed(options.speed);
        }

        // Store in map
        this.playingAnimations.set(options.key, animationTrack);

        // Clean up from map when animation ends
        animationTrack.Stopped.Connect(() => {
            if (this.playingAnimations.get(options.key) === animationTrack) {
                this.playingAnimations.delete(options.key);
            }
        });
        this.logger.log(`playing: ${options.key}, id: ${options.animationId}`)

        return animationTrack;
    }

    public stop(key: string, fadeTime?: number): void {
        const track = this.playingAnimations.get(key);
        if (track) {
            track.Stop(fadeTime);
            this.playingAnimations.delete(key);
        }
    }

    public getAnimation(key: string): AnimationTrack | undefined {
        return this.playingAnimations.get(key);
    }

    public isPlaying(key: string): boolean {
        const track = this.playingAnimations.get(key);
        return track?.IsPlaying ?? false;
    }

    public stopAll(fadeTime?: number): void {
        this.playingAnimations.forEach((track) => {
            track.Stop(fadeTime);
        });
        this.playingAnimations.clear();
    }

    public getPlayingAnimations(): ReadonlyMap<string, AnimationTrack> {
        return this.playingAnimations;
    }
    public getByKey(key: string): AnimationTrack | undefined {
        return this.playingAnimations.get(key);
    }
}