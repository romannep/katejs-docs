/*
Copyright © 2018 Roman Nep <neproman@gmail.com>

This file is part of kate-form-material-kit-react library.

Library kate-form-material-kit-react is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Library kate-form-material-kit-react is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Library kate-form-material-kit-react.
If not, see <https://www.gnu.org/licenses/>.
*/

import React, { Fragment } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import DocIcon from '@material-ui/icons/Description';
import { NavLink } from 'react-router-dom';
import cx from 'classnames';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import MenuIcon from '@material-ui/icons/Menu';
import AppIcon from '@material-ui/icons/AppsOutlined';
import Scrollbar from 'react-custom-scrollbars';
import InfoOutline from '@material-ui/icons/InfoOutlined';
import Check from '@material-ui/icons/Check';
import Warning from '@material-ui/icons/Warning';
import Snackbar from 'material-kit-react-package/dist/components/Snackbar/SnackbarContent';
import Tooltip from '@material-ui/core/Tooltip';

import { KateForm } from 'kate-form';

import { renderThumb } from './Layout';


const layoutMenuConnector = ({ t, elements, classes, title,
  drawerOpen, logo, switchDrawer, path, brandClick }) => {
  const drawerContent = (
    <List className={classes.list}>
      <ListItem
        onClick={brandClick}
        button
        className={cx(classes.listItem, {
          [classes.listItemCollapsed]: !drawerOpen,
        })}
      >
        <ListItemIcon className={drawerOpen ? classes.iconLogo : classes.icon}>
          {logo ? <img src={logo} alt="logo" /> : <AppIcon />}
        </ListItemIcon>
        {drawerOpen ?
          <ListItemText primary={t(title)} />
          : null}
      </ListItem>
      {
        drawerOpen && (
          <div>
            <KateForm path={`${path}.topElements`} />
          </div>
        )
      }
      <ListItem
        button
        onClick={switchDrawer}
        className={cx(classes.listItem, { [classes.listItemCollapsed]: !drawerOpen })}
      >
        <ListItemIcon className={classes.icon}><MenuIcon /></ListItemIcon>
        {drawerOpen ? <ListItemText primary={t('Collapse')} /> : null}
      </ListItem>
      {
        elements.map((route) => {
          const menuItem = (
            <ListItem
              button
              onClick={route.onClick}
              key={route.key}
              className={cx(classes.listItem, {
                [classes.listItemCollapsed]: !drawerOpen,
                [classes.currentItem]: route.current,
              })}
            >
              {drawerOpen ?
                (
                  <Fragment>
                    <ListItemIcon className={classes.icon}>
                      {route.icon ? <route.icon /> : <DocIcon />}
                    </ListItemIcon>
                    <ListItemText primary={t(route.title)} />
                  </Fragment>
                ) : (
                  <Tooltip
                    title={t(route.title)}
                    placement="right"
                    classes={{ tooltip: classes.tooltip }}
                  >
                    <span>
                      <ListItemIcon className={classes.icon}>
                        {route.icon ? <route.icon /> : <DocIcon />}
                      </ListItemIcon>
                    </span>
                  </Tooltip>
                )}
            </ListItem>
          );
          if (route.path) {
            return (
              <NavLink to={route.path} key={route.path}>
                {menuItem}
              </NavLink>
            );
          }
          return menuItem;
        })
      }
      <ListItem>
        <ListItemText primary="" />
      </ListItem>

    </List>
  );

  return (
    <Fragment>
      <Hidden smDown>
        <Drawer
          variant="permanent"
          anchor="left"
          classes={{
            docked: cx(classes.drawerPaper, { [classes.drawerOpen]: drawerOpen }),
            paper: cx(classes.drawerPaper, { [classes.drawerOpen]: drawerOpen }),
          }}
        >
          <Scrollbar
            renderThumbVertical={renderThumb}
            autoHide
          >
            {drawerContent}
          </Scrollbar>
        </Drawer>
      </Hidden>
      <Hidden mdUp>
        {
          drawerOpen ? (
            <Drawer
              variant="temporary"
              anchor="left"
              classes={{
                docked: cx(classes.drawerPaper, { [classes.drawerOpen]: drawerOpen }),
                paper: cx(classes.drawerPaper, { [classes.drawerOpen]: drawerOpen }),
              }}
              open
            >
              {drawerContent}
            </Drawer>
          ) : (
            <Drawer
              variant="permanent"
              anchor="left"
              classes={{
                docked: cx(classes.drawerPaper, { [classes.drawerOpen]: drawerOpen }),
                paper: cx(classes.drawerPaper, { [classes.drawerOpen]: drawerOpen }),
              }}
            >
              {drawerContent}
            </Drawer>
            )
        }
      </Hidden>
    </Fragment>
  );
};

const getAlertIcon = (type) => {
  switch (type) {
    case 'danger':
      return Warning;
    case 'success':
      return Check;
    default:
      return InfoOutline;
  }
};

const layoutAlertsConnector = ({ elements, t }) => (
  <Fragment>
    {
      elements.map(alert => (
        <Snackbar
          key={`${t(alert.title)}${t(alert.description)}`}
          message={
            <span>
              <b>{t(alert.title)}</b> {t(alert.description)}
            </span>
          }
          close
          color={alert.type || 'info'}
          icon={getAlertIcon(alert.type)}
        />
      ))
    }
  </Fragment>
);

const Elements = {
  LayoutMenu: Symbol('layoutMenuConnector'),
  LayoutAlerts: Symbol('layoutAlertsConnector'),
};

const components = {
  // [Elements.LayoutMenu]: withStyles(tooltipStyle)(layoutMenuConnector),
  [Elements.LayoutMenu]: layoutMenuConnector,
  [Elements.LayoutAlerts]: layoutAlertsConnector,
};

export {
  Elements,
  components,
};
