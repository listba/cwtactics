package com.client.menu.GUI.tools;

import java.awt.Image;
import java.util.ArrayList;
import org.newdawn.slick.Color;
import org.newdawn.slick.Graphics;

/**
 * This helps create a menu for the program
 *
 * @author Crecen
 */
public class PixMenu extends MovingPix{
    public final int REGULAR = 0;
    public final int ROUND_BOX = 1;
    public final int RECTANGLE = 2;
    public final int RND_BORDER = 3;
    public final int BORDER = 4;

    protected ArrayList<PixMenuItem> menuItems;
    protected double globalOpac;
    public int select;

    private PixMenuItem item;
    
    public PixMenu(int locx, int locy, double speed){
        super(locx, locy, speed);
        menuItems = new ArrayList<PixMenuItem>();
        globalOpac = 0;
        select = 0;
        item = new PixMenuItem(locx, locy, speed);
    }

    //Makes a new item with the options you specify
    public void createNewItem(int locx, int locy, double speed){
        item = new PixMenuItem(locx, locy, speed);
    }

    //Make sure you create a new item or items might overlap each other
    public void addMenuImgPart(String imgPath, String display, double opac){
        addMenuImgPart(imgPath, display, opac, null);
    }
    public void addMenuImgPart(String imgPath, String display,
            double opac, Color theColor){
        setImage(imgPath);
        setText(display);
        item.addPixPart(logoPic, logoTxt, opac, theColor);
    }
    public void addMenuImgPart(Image img, String display, double opac){
        addMenuImgPart(img, display, opac, null);
    }
    public void addMenuImgPart(Image img, String display,
            double opac, Color theColor){
        setImage(img, 0, 0);
        setText(display);
        item.addPixPart(logoPic, logoTxt, opac, theColor);
    }

    //Make sure you create a new item or items might overlap each other
    public void addMenuPart(int select, boolean selectable){
        addMenuPart(select, 0, 0, selectable);
    }
    public void addMenuPart(int select, int sizex, int sizey,
            boolean selectable){
        addItem(REGULAR, select, null, sizex, sizey, 0, selectable);
    }
    
    //Make sure you create a new item or items might overlap each other
    public void addRoundBox(int select, Color theColor, 
            int sizex, int sizey, int arc, boolean selectable){
        addItem(ROUND_BOX, select, theColor, sizex, sizey, arc, selectable);
    }
    
    //Make sure you create a new item or items might overlap each other
    public void addBox(int select, Color theColor, int sizex, int sizey,
            boolean selectable){
        addItem(RECTANGLE, select, theColor, sizex, sizey, 0, selectable);
    }

    //Make sure you create a new item or items might overlap each other
    public void addBorder(int select, Color theColor, int sizex, int sizey,
            boolean selectable){
        addItem(BORDER, select, theColor, sizex, sizey, 0, selectable);
    }

    //Make sure you create a new item or items might overlap each other
    public void addRoundBorder(int select, Color theColor, int sizex,
            int sizey, int arc, boolean selectable){
        addItem(RND_BORDER, select, theColor, sizex, sizey, arc, selectable);
    }

    public void clearAllItems(){
        menuItems.clear();
        select = 0;
    }

    public void setOpacity(double opacity){
        if(opacity >= 0 && opacity <= 1)
            globalOpac = opacity;
    }

    public void setItemPosition(int index, int locx, int locy){
        setItemPosition(index, locx, locy, false);
    }
    public void setItemPosition(int index, int locx, int locy,
            boolean addPrev){
        if(index >= 0 && index < menuItems.size()){
            item = menuItems.get(index);
            if(addPrev)
                item.setFinalPosition((int)item.posx+locx,
                        (int)item.posy+locy);
            else
                item.setFinalPosition(locx, locy);
            menuItems.set(index, item);
        }
    }

    //Sets whether this item is drawable
    public void setItemDraw(int index, boolean draw){
        if(index >= 0 && index < menuItems.size()){
            item = menuItems.get(index);
            item.drawthis = draw;
            menuItems.set(index, item);
        }
    }

    //This changes how selected items react in a menu
    public void setItemChoice(int index, int choice){
        if(index >= 0 && index < menuItems.size()){
            item = menuItems.get(index);
            item.choice = choice;
            menuItems.set(index, item);
        }
    }

    public void setItemText(int index, int itemIndex, String display){
        if(index >= 0 && index < menuItems.size()){
            item = menuItems.get(index);
            setText(display);
            item.changePixText(itemIndex, logoTxt);
            menuItems.set(index, item);
        }
    }

    public void setItemImage(int index, int itemIndex, String imgRef){
        if(index >= 0 && index < menuItems.size()){
            item = menuItems.get(index);
            setImage(imgRef);
            item.changePixImage(itemIndex, logoPic);
            menuItems.set(index, item);
        }
    }

    public String getItemText(int index){
        return (index >= 0 && index < menuItems.size()) ?
            menuItems.get(index).logoTxt : "";
    }

    public ArrayList<PixMenuItem> getItems(){
        return menuItems;
    }

    public boolean mouseSelect(int mx, int my){
        double sx = 0;
        double sy = 0;
        for(PixMenuItem itm: menuItems){
            if(!itm.drawthis)
                continue;

            if(itm.selectable && select != itm.select){
                sx = itm.sizex;
                sy = itm.sizey;
                if(itm.logoPic != null && sx*sy == 0){
                    sx = itm.logoPic.getWidth();
                    sy = itm.logoPic.getHeight();
                }

                if(mx > itm.posx+posx &&
                        mx < itm.posx+posx+sx){
                    if(my > itm.posy+posy &&
                            my < itm.posy+posy+sy){
                        select = itm.select;
                        return true;
                    }
                }
            }
        }
        return false;
    }

    @Override
    public void render(Graphics g){
        renderSpeed();

        for(PixMenuItem itm: menuItems){
            itm.renderSpeed();
            //Checks if this item should be drawn
            if(!itm.drawthis)
                continue;

            switch(itm.index){
                case REGULAR:
                   //This draws picture items to the screen
                    itm.changeAll(select == itm.select, globalOpac);                   
                    if(itm.logoPic != null){
                        logoPic = itm.logoPic;
                        if(itm.theColor == null)
                            g.drawImage(logoPic, (int)(posx+itm.posx),
                                (int)(posy+itm.posy));
                        else
                            g.drawImage(logoPic, (int)(posx+itm.posx),
                                (int)(posy+itm.posy), itm.theColor);
                    }else if(!itm.logoTxt.matches("")){
                        logoTxt = itm.logoTxt;
                        if(itm.theColor != null)
                            g.setColor(itm.theColor);
                        g.drawString(logoTxt, (int)(posx+itm.posx),
                                (int)(posy+itm.posy));
                    }
                    break;
                default:
                    if(select == itm.select || !itm.selectable){
                        if(itm.theColor != null)
                            g.setColor(itm.theColor);
                        if(itm.index == RECTANGLE)
                            g.fillRect((int)(posx+itm.posx), (int)
                                 (posy+itm.posy), itm.sizex, itm.sizey);
                        else if(itm.index == ROUND_BOX)
                            g.fillRoundRect((int)(posx+itm.posx),
                                (int)(posy+itm.posy), itm.sizex,
                                itm.sizey, itm.arc);
                        else if(itm.index == BORDER)
                            g.drawRect((int)(posx+itm.posx), (int)
                               (posy+itm.posy), itm.sizex, itm.sizey);
                        else if(itm.index == RND_BORDER)
                            g.drawRoundRect((int)(posx+itm.posx),
                                (int)(posy+itm.posy), itm.sizex,
                                itm.sizey, itm.arc);
                    }
            }
        }
    }

    private void addItem(int index, int select, Color theColor,
            int sizex, int sizey, int arc, boolean selectable){
        item.index = index;
        item.select = select;
        item.theColor = theColor;
        item.selectable = selectable;
        item.sizex = sizex;
        item.sizey = sizey;
        item.arc = arc;
        if(index != REGULAR)
            item.pixPart = null;
        menuItems.add(item);
    }
}