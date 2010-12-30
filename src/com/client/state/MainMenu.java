package com.client.state;

import com.cwt.io.KeyControl;
import com.client.menu.GUI.BGPicture;
import com.client.menu.GUI.LogoDraw;
import com.client.state.mini.ExitMiniScr;
import com.client.state.mini.MenuMiniScr;
import com.client.state.mini.TitleMiniScr;
import com.cwt.system.jslix.tools.TextImgLibrary;
import com.cwt.system.jslix.state.Screen;
import com.cwt.system.jslix.KeyPress;
import com.cwt.system.jslix.SlixLibrary;
import com.system.reader.MenuReader;
import java.awt.Component;
import java.awt.Graphics2D;
import org.newdawn.slick.Color;
import org.newdawn.slick.Graphics;

/**
 * MainMenu
 * 
 * Replaces the MainMenuState class. Uses JSlix functionality within the
 * class.
 *
 * @author Crecen
 */
public class MainMenu extends Screen {

    private boolean scrSwitch;
    private int column;
    private MenuReader reader;

    private TextImgLibrary txtLib;

    private BGPicture bgPicture;
    private LogoDraw menuLogo;
    private TitleMiniScr titleScr;
    private ExitMiniScr exitScr;
    private MenuMiniScr menuScr;

    public MainMenu(){
        reader = new MenuReader("data/mainmenu.xml");
        initText();
    }

    @Override
    public void init() {       
        initBackground();

        titleScr = new TitleMiniScr(txtLib, reader.getTitleData());
        exitScr = new ExitMiniScr(txtLib, reader.getExitData(),
             scr_width, scr_height, 0);
        menuScr = new MenuMiniScr(txtLib, reader.getMenuData(),
                reader.getArrow(), reader.getMenuJustify());
    }

    @Override
    public void update(int timePassed) {
        if(timePassed < 0)    return;
         if(KeyControl.isUpDown() || KeyControl.isDownDown() ||
           KeyControl.isLeftDown() || KeyControl.isRightDown())
                scr_mouseLock();

        if(scr_mouseLock)
            scr_mouseRelease();

        switch(column){
            case 0:
                startScr();
                break;
            case -1:
            case 2:
                exitScr();
                break;
            case 3:
                versusScr();
            default:
                menuScr();
        }
    }

    @Override
    public void render(Graphics g) {
        bgPicture.render(g);

        switch(column){
            case 0:
                startScr(g);
                break;
            case -1:
            case 2:
                exitScr(g);
                break;
            default:
                menuScr(g);
        }
        menuLogo.render(g);
    }

    @Override
    public void render(Graphics2D g, Component dthis) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    private void startScr(){
        titleScr.column = column;
        titleScr.scrSwitch = scrSwitch;
        titleScr.menuLogo = menuLogo;
        titleScr.scr_sysTime = scr_sysTime;
        titleScr.update();
        menuLogo = titleScr.menuLogo;
        column = titleScr.column;
        scrSwitch = titleScr.scrSwitch;
    }
    private void startScr(Graphics g){
        titleScr.render(g);
    }

    private void exitScr(){
        exitScr.column = column;
        exitScr.scrSwitch = scrSwitch;
        exitScr.menuLogo = menuLogo;
        exitScr.scr_mouseLock = scr_mouseLock;
        exitScr.scr_mouseScroll = scr_mouseScroll;
        exitScr.scr_mouseX = KeyPress.getMouseX();
        exitScr.scr_mouseY = KeyPress.getMouseY();
        exitScr.scr_exit = scr_delete;
        exitScr.update();
        menuLogo = exitScr.menuLogo;
        column = exitScr.column;
        scrSwitch = exitScr.scrSwitch;
        scr_mouseLock = exitScr.scr_mouseLock;
        scr_delete = exitScr.scr_exit;
        if(exitScr.setLock)    scr_mouseLock();
    }
    private void exitScr(Graphics g){
        exitScr.render(g);
    }

    private void menuScr(){
        menuScr.column = column;
        menuScr.scrSwitch = scrSwitch;
        menuScr.menuLogo = menuLogo;
        menuScr.scr_mouseLock = scr_mouseLock;
        menuScr.scr_mouseScroll = scr_mouseScroll;
        menuScr.scr_mouseX = KeyPress.getMouseX();
        menuScr.scr_mouseY = KeyPress.getMouseY();
        menuScr.scr_scroll = scr_scroll;
        menuScr.update();
        menuLogo = menuScr.menuLogo;
        column = menuScr.column;
        scrSwitch = menuScr.scrSwitch;
        scr_mouseLock = menuScr.scr_mouseLock;
        scr_scroll = menuScr.scr_scroll;
        scr_scrollInd = menuScr.scr_scrollIndex;
        if(menuScr.setLock)    scr_mouseLock();
        scr_mouseControl(); //Makes sure you can scroll down and up
    }
    private void menuScr(Graphics g){
        menuScr.render(g);
    }

    private void versusScr(){
        SlixLibrary.bringScreenToFront(scr_index+1);
        column = 1;
        scrSwitch = true;
    }

    private void initBackground(){
        column = 0;
        scrSwitch = true;

        String[] allImages = new String[reader.noOfBGItems()];
        for(int i = 0; i < reader.noOfBGItems(); i++)
            allImages[i] = reader.getBGPrefix()+(i+1)+reader.getBGSuffix();
        bgPicture = new BGPicture(allImages, scr_width, scr_height);
        bgPicture.setFileImage(reader.getUserBGRef());

        menuLogo = new LogoDraw();
        menuLogo.addPictureLogo(reader.getTitleLogo(),
                145, -100, 350, 150, 1);
        menuLogo.addPictureLogo(reader.getMiniLogo(),
                0, -100, 75, 75, 1);
        menuLogo.addScrollFontLogo(" - ", 0, 480, 640, 20, 1, 0.1);
        menuLogo.setShadowColor(0, Color.black);
        menuLogo.setShadowOffset(0, 2);
        menuLogo.setShadowColor(1, Color.black);
        menuLogo.setShadowOffset(1, 2);
    }

    private void initText(){
        txtLib = new TextImgLibrary();
        txtLib.addImage(reader.getAlpha());
        txtLib.addAllCapitalLetters(txtLib.getImage(0), "", 6, 5, 0);
        txtLib.addLetter('-', txtLib.getImage(0), "", 6, 5, 29);
        txtLib.addLetter('\'', txtLib.getImage(0), "", 6, 5, 28);
        txtLib.addLetter(',', txtLib.getImage(0), "", 6, 5, 27);
        txtLib.addLetter('.', txtLib.getImage(0), "", 6, 5, 26);
    }


}
