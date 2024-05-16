// Linux implementation of the watcher() function.

// gcc -o watcher-lin watcher.c watcher-lin.c `pkg-config --libs --cflags dbus-1`
// ./watcher-lin

// dbus-monitor "type='signal',interface='org.freedesktop.portal.Settings',member='SettingChanged',arg0='org.freedesktop.appearance',arg1='color-scheme'"

#ifndef __linux__
	#error "watcher-lin.c is only expected to be compiled on Linux"
#endif

#include <stdio.h>
#include <string.h>
#include <stdint.h>

#include <dbus/dbus.h>  // sudo apt install libdbus-1-dev

#include "watcher.h"


// User data for filter callback
typedef struct {
    int lastResult;
    watcher_callback callback;
    void *reference;
} filter_data;


/*
// String representation of a value
static char *value_to_string(int value)
{
    if (value == -1) return "error";
    if (value == 0) return "unknown";
    if (value == 1) return "dark";
    if (value == 2) return "light";
    return "unexpected";
}
*/


// Parse a theme response
static int parse_theme(DBusMessageIter *iter)
{
    int type = dbus_message_iter_get_arg_type(iter);
    if (type != DBUS_TYPE_VARIANT)
    {
        fprintf(stderr, "ERROR: dbus_message_iter_get_arg_type() != DBUS_TYPE_VARIANT (inner)\n");
        return -1;
    }

    DBusMessageIter variant_iter;
    dbus_message_iter_recurse(iter, &variant_iter);

    if (dbus_message_iter_get_arg_type(&variant_iter) != DBUS_TYPE_UINT32)
    {
        fprintf(stderr, "ERROR: dbus_message_iter_get_arg_type() != DBUS_TYPE_UINT32 (inner, inner)\n");
        return -1;
    }

    uint32_t value = (uint32_t)-1;
    dbus_message_iter_get_basic(&variant_iter, &value);
    // 0=unknown, 1=dark, 2=light (-1=error)

    return (int)value;
}


// Parse a message reply
static int parse_reply(DBusMessage *msg)
{
    if (msg == NULL)
    {
        fprintf(stderr, "ERROR: No reply to parse\n");
        return -1;
    }

    DBusMessageIter iter;
    if (!dbus_message_iter_init(msg, &iter))
    {
        fprintf(stderr, "ERROR: dbus_message_iter_init() - no arguments\n");
        return -1;
    }

    int type = dbus_message_iter_get_arg_type(&iter);
    // Unexpected reply -- returned for "Requested setting not found"
    if (type == DBUS_TYPE_STRING)
    {
        const char *str = "";
        dbus_message_iter_get_basic(&iter, &str);
        fprintf(stderr, "ERROR: dbus_message_iter_get_arg_type() == DBUS_TYPE_STRING (reply) - %s\n", str);
        return -1;
    }
    // Expected reply
    if (type != DBUS_TYPE_VARIANT)
    {
        fprintf(stderr, "ERROR: dbus_message_iter_get_arg_type() != DBUS_TYPE_VARIANT (reply)\n");
        return -1;
    }

    DBusMessageIter variant_iter = {0};
    dbus_message_iter_recurse(&iter, &variant_iter);
    return parse_theme(&variant_iter);
}


// Display and free an error
static void mydbus_error(DBusError *err, const char *prefix)
{
    fprintf(stderr, "ERROR: DBus Error - %s: %s\n", prefix ? prefix : "", err->message ? err->message : "(null)");
    dbus_error_free(err);
    return;
}


// Connect to the bus
static DBusConnection *mydbus_connect()
{
    DBusError err;
    dbus_error_init(&err);
    DBusConnection *conn = dbus_bus_get(DBUS_BUS_SESSION, &err);
    if (dbus_error_is_set(&err))
    {
        mydbus_error(&err, "dbus_bus_get(DBUS_BUS_SESSION)");
        return NULL;
    }
    if (conn == NULL)
    {
        fprintf(stderr, "ERROR: dbus_bus_get() - no connection\n");
        return NULL;
    }
    return conn;
}


// Request a name on the bus
static const char *mydbus_request_name(DBusConnection *conn, const char *name)
{
    DBusError err;
    dbus_error_init(&err);
    int ret = dbus_bus_request_name(conn, name, DBUS_NAME_FLAG_REPLACE_EXISTING, &err);
    if (dbus_error_is_set(&err))
    { 
        mydbus_error(&err, "dbus_bus_request_name()");
        return NULL;
    }
    if (ret != DBUS_REQUEST_NAME_REPLY_PRIMARY_OWNER)
    { 
        fprintf(stderr, "ERROR: dbus_bus_request_name - not primary owner\n");
        return NULL;
    }
    return name;
}


// Send a message with two string parameters, wait for a reply, parse it in a specific way
static int mydbus_send_message(DBusConnection *conn, const char *destination, const char *path, const char *iface, const char *method, const char *param1, const char *param2)
{
    // Create message for new method call
    DBusMessage *msg = dbus_message_new_method_call(destination, path, iface, method);
    if (msg == NULL)
    {
        fprintf(stderr, "ERROR: dbus_message_new_method_call()\n");
        return -1;
    }

    // Append parameters
    dbus_message_append_args(msg, DBUS_TYPE_STRING, &param1, DBUS_TYPE_STRING, &param2, DBUS_TYPE_INVALID);

    // Send message
    DBusPendingCall *pending;
    if (!dbus_connection_send_with_reply(conn, msg, &pending, -1))
    {
        fprintf(stderr, "ERROR: dbus_connection_send_with_reply()\n");
        return -1;
    }
    if (pending == NULL)
    {
        fprintf(stderr, "ERROR: dbus_connection_send_with_reply() - no handle\n");
        return -1;
    }
    dbus_connection_flush(conn);
    dbus_message_unref(msg);

    // Wait for reply
    dbus_pending_call_block(pending);

    // Receive reply
    msg = dbus_pending_call_steal_reply(pending);
    if (msg == NULL)
    {
        fprintf(stderr, "ERROR: dbus_pending_call_steal_reply() - no reply\n");
        return -1;
    }
    dbus_pending_call_unref(pending);

    // Parse reply
    int value = parse_reply(msg);

    // Free reply
    dbus_message_unref(msg);   

    return value;
}


// Filter callback
static DBusHandlerResult mydbus_message_filter(DBusConnection *conn, DBusMessage *msg, void *user_data)
{
    const char *iface = "org.freedesktop.portal.Settings";
    const char *member = "SettingChanged";
    const char *expectedNamespace = "org.freedesktop.appearance";
    const char *expectedKey = "color-scheme";
    filter_data *my_filter_data = (filter_data *)user_data;

    if (!dbus_message_is_signal(msg, iface, member))
    {
        //fprintf(stderr, "ERROR: dbus_message_is_signal()\n");
        return DBUS_HANDLER_RESULT_NOT_YET_HANDLED;
    }

    DBusMessageIter iter;
    if (!dbus_message_iter_init(msg, &iter))
    {
        fprintf(stderr, "ERROR: dbus_message_iter_init() - no parameters (filter)\n");
        return DBUS_HANDLER_RESULT_NOT_YET_HANDLED;
    }

    if (dbus_message_iter_get_arg_type(&iter) != DBUS_TYPE_STRING)
    {
        fprintf(stderr, "ERROR: message_iter_get_arg_type() != DBUS_TYPE_STRING (filter, param 1)\n");
        return DBUS_HANDLER_RESULT_NOT_YET_HANDLED;
    }

    const char *namespace = "";
    dbus_message_iter_get_basic(&iter, &namespace);
    if (strcmp(namespace, expectedNamespace) != 0)
    {
        fprintf(stderr, "ERROR: filter namespace does not match: %s\n", namespace);
        return DBUS_HANDLER_RESULT_NOT_YET_HANDLED;
    }

    if (!dbus_message_iter_next(&iter))
    {
        fprintf(stderr, "ERROR: message_iter_next() (filter, param 2)\n");
        return DBUS_HANDLER_RESULT_NOT_YET_HANDLED;
    }

    if (dbus_message_iter_get_arg_type(&iter) != DBUS_TYPE_STRING)
    {
        fprintf(stderr, "ERROR: message_iter_get_arg_type() != DBUS_TYPE_STRING (filter, param 2)\n");
        return DBUS_HANDLER_RESULT_NOT_YET_HANDLED;
    }
    
    const char *key = "";
    dbus_message_iter_get_basic(&iter, &key);
    if (strcmp(key, expectedKey) != 0)
    {
        fprintf(stderr, "ERROR: filter key does not match: %s\n", key);
        return DBUS_HANDLER_RESULT_NOT_YET_HANDLED;
    }

    if (!dbus_message_iter_next(&iter))
    {
        fprintf(stderr, "ERROR: message_iter_next() (filter, param 3)\n");
        return DBUS_HANDLER_RESULT_NOT_YET_HANDLED;
    }

    int value = parse_theme(&iter);
    if (value == 0 || value == 1 || value == 2)
    {
        int result = -1;
        //fprintf(stderr, "DEBUG: update %d %s\n", value, value_to_string(value));
        if (value == 1) result = 0; // dark
        else if (value == 2 || value == 0) result = 1;    // light or unknown
        // else { ; }  // error

        // Callback if result has changed
        if (my_filter_data->lastResult != result && (result == 0 || result == 1))
        {
            my_filter_data->lastResult = result;
            my_filter_data->callback(result, my_filter_data->reference);
        }
    }
    else
    {
        fprintf(stderr, "ERROR: parse_theme() (filter)\n");
    }
    return DBUS_HANDLER_RESULT_HANDLED;
}


// Main code
int watcher(watcher_callback callback, void *reference)
{
    // Connect to the bus
    DBusConnection *conn = mydbus_connect();
    if (conn == NULL) return -1;

    // Request a name on the bus
    if (mydbus_request_name(conn, "dev.danjackson.vscode-auto-dark-mode-windows") == NULL) return -1;

    // Get the current theme value
    const char *destination = "org.freedesktop.portal.Desktop";
    const char *path = "/org/freedesktop/portal/desktop";
    const char *iface = "org.freedesktop.portal.Settings";
    const char *method = "Read";
    const char *paramNamespace = "org.freedesktop.appearance";
    const char *paramKey = "color-scheme";
    int value = mydbus_send_message(conn, destination, path, iface, method, paramNamespace, paramKey);

    // Process initial value
    int result = -1;
    //fprintf(stderr, "DEBUG: initial %d %s\n", value, value_to_string(value));
    if (value == 1) result = 0; // dark
    else if (value == 2 || value == 0) result = 1;    // light or unknown
    else
    {
        fprintf(stderr, "ERROR: Cannot determine initial theme value -- perhaps unsupported?\n");
        return -1;
    }

    // Callback with result
    if (result == 0 || result == 1) callback(result, reference);
    // else { ; }  // error

    // Subscribe to color scheme changes
    filter_data my_filter_data = {0};
    my_filter_data.lastResult = result;
    my_filter_data.callback = callback;
    my_filter_data.reference = reference;
    const char *match = "type='signal',interface='org.freedesktop.portal.Settings',member='SettingChanged',arg0='org.freedesktop.appearance',arg1='color-scheme'";
    DBusError err;
    dbus_error_init(&err);
    dbus_bus_add_match(conn, match, &err);
    if (dbus_error_is_set(&err))
    {
        mydbus_error(&err, "dbus_bus_add_match()");
        return -1;
    }    
    if (!dbus_connection_add_filter(conn, &mydbus_message_filter, &my_filter_data, NULL))
    {
        fprintf(stderr, "ERROR: dbus_connection_add_filter()\n");
        return -1;
    }
    dbus_connection_flush(conn);

    // Event loop
    for (;;)
    {
        // Wait (up to forever) for a message, dispatch any that arrive.
        if (!dbus_connection_read_write_dispatch(conn, -1))
        {
            fprintf(stderr, "ERROR: dbus_connection_read_write_dispatch()\n");
            break;
        }
    }

    // Unreference connection
    dbus_connection_unref(conn);

    return 0;
}
