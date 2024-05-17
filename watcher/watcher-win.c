// Windows implementation of the watcher() function.

// cl.exe watcher.c watcher-win.c /link /out:watcher-win.exe
// watcher-win.exe

#ifndef _WIN32
	#error "watcher-win.c is only expected to be compiled on Windows"
#endif

#include <windows.h>
#include <stdio.h>

#include "watcher.h"

#if defined(_MSC_VER)
#pragma comment(lib, "advapi32") // RegOpenKeyEx / RegGetValue / RegNotifyChangeKeyValue / RegCloseKey
#endif

int watcher(watcher_callback callback, void *reference)
{
	HKEY hMainKey = HKEY_CURRENT_USER;
	const wchar_t *key = L"Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";
	const wchar_t *value = L"AppsUseLightTheme";

	HKEY hKey = NULL;
	LSTATUS lErrorCode = RegOpenKeyExW(hMainKey, key, 0, KEY_NOTIFY, &hKey);
	if (lErrorCode != ERROR_SUCCESS)
	{
		fwprintf(stderr, L"ERROR: RegOpenKeyEx() failed (%d): %ls\n", lErrorCode, key);
		return -1;
	}
	
	HANDLE hEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
	if (hEvent == NULL)
	{
		fwprintf(stderr, L"ERROR: CreateEvent() failed.\n");
		return -1;
	}

	DWORD dwFilter = REG_NOTIFY_CHANGE_LAST_SET | REG_NOTIFY_THREAD_AGNOSTIC;
	lErrorCode = RegNotifyChangeKeyValue(hKey, TRUE, dwFilter, hEvent, TRUE);
	if (lErrorCode != ERROR_SUCCESS)
	{
		fwprintf(stderr, L"ERROR: RegNotifyChangeKeyValue() failed (%d): %ls\n", lErrorCode, key);
		return -1;
	}

	DWORD previous = 0xFFFFFFFF;
	for (;;)
	{
		// Query current value
		DWORD dwData = 0xFFFFFFFF;
		DWORD cbData = sizeof(dwData);
		lErrorCode = RegGetValueW(hMainKey, key, value, RRF_RT_REG_DWORD, NULL, &dwData, &cbData);
		if (lErrorCode != ERROR_SUCCESS)
		{
			fwprintf(stderr, L"ERROR: RegGetValue() failed (%d): %ls\n", lErrorCode, key);
			break;
		}
		
		// Return initial and changed values
		if (dwData != previous)
		{
			if (callback) {
				callback((int)dwData, reference);
			} else {
				fwprintf(stdout, L"%u\n", dwData);
				fflush(stdout);
			}
			previous = dwData;
		}

		// Wait for value change
		if (WaitForSingleObject(hEvent, INFINITE) == WAIT_FAILED)
		{
			fwprintf(stderr, L"ERROR: WaitForSingleObject() failed (%d): %ls\n", GetLastError(), key);
			break;
		}
	}

	CloseHandle(hEvent);
	RegCloseKey(hKey);	
	return -1;
}
