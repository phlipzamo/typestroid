import { Scene, GameObjects } from 'phaser';
import { AlignGrid } from '../common/util/AlignGrid';
import { AssetText } from '../myObjects/AssetText';
import { TypeableAstroid } from '../myObjects/TypeableAstroid';
import { SPEED } from '../myObjects/Speed';
import { Laser, Lasers } from '../myObjects/Lasers';

export class MainMenu extends Scene
{
    background: GameObjects.Image;
    title: GameObjects.Text;
    aGrid:AlignGrid;
    earth: GameObjects.Image;
    waterTag: AssetText;
    groupOfAstroids: GameObjects.Group;
    startText: TypeableAstroid;
    ufo: GameObjects.Sprite;
    target: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody|undefined;
    lasers: Lasers;
    shoot: boolean;
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.shoot = false;
        //grid to place objs, creates a 5x5 grid Left to right increasing starts at 0
        this.aGrid = new AlignGrid(this, 5,5);
        //this.aGrid.showNumbers();
        //following line will show the grid with indexes
        this.groupOfAstroids = this.add.group();
        this.background = this.add.image(512, 384, 'background');
        this.createAndPlaceEarthSprite(12)
        this.ufo = this.add.sprite(0, 0, 'ufo');
        this.aGrid.placeAtIndex(22,this.ufo);
        this.createAndPlaceTitle("TYPE TO SAVE THE WORLD", 7)
        this.lasers = new Lasers(this);
        this.groupOfAstroids.add(this.createAndPlaceTypeableAstroid("easy",16));
        this.groupOfAstroids.add(this.createAndPlaceTypeableAstroid("medium",17));
        this.groupOfAstroids.add(this.createAndPlaceTypeableAstroid("hard",18));
        //handles the typing interaction
        this.createKeyboardTypingHandler();
        //this.aGrid.showNumbers()
        this.createAnimations();
        this.waterTag = new AssetText(this);
    }
    update(time:any){
        //spin and bounce earth
        this.earth.rotation += 0.005;
        this.earth.y = this.earth.y + Math.sin(time / 1000 * 2)
        if(this.target){
            var change = 30;
            if(Math.abs(this.target.x-this.ufo.x)<15){
                change = 1;
            }

            if(this.target.x > this.ufo.x){
                this.ufo.x +=change;
            }
            else if(this.target.x < this.ufo.x){
                this.ufo.x -=change;
            }
            if(Math.round(this.target.x) == Math.round(this.ufo.x) && this.shoot){
                this.shoot = false;
                this.lasers.fireLaser(this.ufo.x, this.ufo.y);
            }
        }
    }
    createKeyboardTypingHandler(){
        if(!this.input.keyboard){return}
        this.input.keyboard.on('keydown', (keyPressed:any) => {
            //find typed astroid
            const astroidBeingTyped = <TypeableAstroid> this.groupOfAstroids.getChildren()
                .find((child)=>{
                    var typeableAstroid:TypeableAstroid= <TypeableAstroid> child;
                    return typeableAstroid.beingTyped===true;
                }
            );
            if(astroidBeingTyped){
                if(!astroidBeingTyped.typeableText.hasUntypedLetters()){return}
                if(astroidBeingTyped.typeableText.isNextUntypedLetter(keyPressed.key)){
                    this.target = astroidBeingTyped.astroid;
                    astroidBeingTyped.typeableText.typeNextLetter(true);
                    //check if that was the last letter
                    if(!astroidBeingTyped.typeableText.hasUntypedLetters()){
                        //astroidBeingTyped.astroid.play("Explode");
                        //this.physics.add.existing(astroidBeingTyped);
                        this.shoot = true;
                        astroidBeingTyped.astroid.on(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY+"Explode",  () => {
                            this.target = undefined;
                            this.scene.stop('MainMenu')
                            this.scene.start('Game', {difficulty: astroidBeingTyped.typeableText.getWord()});
                        }, this);

                        this.physics.add.overlap(this.lasers, astroidBeingTyped.astroid, (obj1, obj2) =>
                            {
                                //console.log(typeof(obj1));
                                var laser = <Laser> obj2;
                                laser.setActive(false);
                                laser.setVisible(false);
                                laser.body?.reset(0,0);
                                laser.setY(-10);
                                //console.log(obj1);
                                var astroid = <Phaser.Types.Physics.Arcade.SpriteWithDynamicBody> obj1;
                                //astroid.setImmovable(true);
                                astroid.play("Explode");
                            });
                    }
                }
                else{
                    const astroidToStartTyping = <TypeableAstroid> this.groupOfAstroids.getChildren()
                    .find((child)=>{
                        var typeableAstroid:TypeableAstroid= <TypeableAstroid> child;
                        return typeableAstroid.startLetter === keyPressed.key;
                    }
                    );
                    if(astroidToStartTyping){
                        this.target = astroidToStartTyping.astroid;
                        astroidBeingTyped.reset();
                        astroidToStartTyping.typeableText.typeNextLetter(true);
                        astroidToStartTyping.setBeingTyped(true);
                    }    
                }
            }
            else{
                //find astroid to start typing 
                const astroidToStartTyping = <TypeableAstroid> this.groupOfAstroids.getChildren()
                    .find((child)=>{
                        var typeableAstroid:TypeableAstroid= <TypeableAstroid> child;
                        return typeableAstroid.startLetter === keyPressed.key;
                    }
                );
                if(astroidToStartTyping){
                    this.target = astroidToStartTyping.astroid;
                    astroidToStartTyping.typeableText.typeNextLetter(true);
                    astroidToStartTyping.setBeingTyped(true);
                }     
            }
        });
    }
    
    createAndPlaceTypeableAstroid(title: string, gridIndex: number){
        var typeableAstroid = new TypeableAstroid(this, 0,0,title,30,SPEED.SLOW)
        var indexPos = this.aGrid.getPosByIndex(gridIndex);
        typeableAstroid.move(indexPos.x, indexPos.y);
        return typeableAstroid;
    }
    createAndPlaceTitle(title: string, gridIndex: number){
        this.title = this.add.text(512, 460, title, {
            fontFamily: 'Arial Black', fontSize: 54, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);
        this.aGrid.placeAtIndex(gridIndex,this.title);
    }
    createAndPlaceEarthSprite(gridIndex: number){
        this.earth = this.add.sprite(0, 0, 'earth');
        this.earth.setScale(10);
        this.aGrid.placeAtIndex(gridIndex, this.earth);
    }
    createAnimations(){
        this.anims.create({
            key: 'stop',
            frames: this.anims.generateFrameNames('astroid', {start: 1, end: 1, zeroPad: 1, prefix: 'A', suffix: '.png'}),
            frameRate: 8,
            repeat: 0
        });
        this.anims.create({
            key: 'Explode',
            frames: this.anims.generateFrameNames('astroid', {start: 1, end: 13, zeroPad: 1, prefix: 'A', suffix: '.png'}),
            frameRate: 40,
            repeat: 0
        });
    }

}
