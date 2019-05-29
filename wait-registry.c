// Wait for a registry DWORD value to change, and return its value.

#include <windows.h>
#include <stdio.h>

// cl.exe wait-registry.c /link /out:wait-registry.exe
// wait-registry.exe HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Themes\Personalize AppsUseLightTheme *

#pragma comment(lib, "advapi32")

// Extracts the main key and updates the key to the sub-key
HKEY ExtractMainKeyPrefix(const wchar_t **key)
{
	HKEY hMainKey = NULL;
	if (!wcsncmp(*key, L"HKLM\\", 5))                                  { hMainKey = HKEY_LOCAL_MACHINE;  *key += 5; }
	else if (!wcsncmp(*key, L"HKCU\\", 5))                             { hMainKey = HKEY_CURRENT_USER;   *key += 5; }
	else if (!wcsncmp(*key, L"HKU\\", 4))                              { hMainKey = HKEY_USERS;          *key += 4; }
	else if (!wcsncmp(*key, L"HKCR\\", 5))                             { hMainKey = HKEY_CLASSES_ROOT;   *key += 5; }
	else if (!wcsncmp(*key, L"HCC\\", 4))                              { hMainKey = HKEY_CURRENT_CONFIG; *key += 4; }
	else if (!wcsncmp(*key, L"HKEY_LOCAL_MACHINE\\", 19))              { hMainKey = HKEY_LOCAL_MACHINE;  *key += 19; }
	else if (!wcsncmp(*key, L"HKEY_USERS\\", 11))                      { hMainKey = HKEY_USERS;          *key += 11; }
	else if (!wcsncmp(*key, L"HKEY_CURRENT_USER\\", 18))               { hMainKey = HKEY_CURRENT_USER;   *key += 18; }
	else if (!wcsncmp(*key, L"HKEY_CLASSES_ROOT\\", 18))               { hMainKey = HKEY_CLASSES_ROOT;   *key += 18; }
	else if (!wcsncmp(*key, L"HKEY_CURRENT_CONFIG\\", 20))             { hMainKey = HKEY_CURRENT_CONFIG; *key += 20; }
	else if (!wcsncmp(*key, L"Computer\\HKEY_LOCAL_MACHINE\\", 9+19))  { hMainKey = HKEY_LOCAL_MACHINE;  *key += 9+19; }
	else if (!wcsncmp(*key, L"Computer\\HKEY_USERS\\", 9+11))          { hMainKey = HKEY_USERS;          *key += 11; }
	else if (!wcsncmp(*key, L"Computer\\HKEY_CURRENT_USER\\", 9+18))   { hMainKey = HKEY_CURRENT_USER;   *key += 9+18; }
	else if (!wcsncmp(*key, L"Computer\\HKEY_CLASSES_ROOT\\", 9+18))   { hMainKey = HKEY_CLASSES_ROOT;   *key += 9+18; }
	else if (!wcsncmp(*key, L"Computer\\HKEY_CURRENT_CONFIG\\", 9+20)) { hMainKey = HKEY_CURRENT_CONFIG; *key += 9+20; }
	return hMainKey;
}

DWORD WaitForRegistryChangeDword(const wchar_t *key, const wchar_t *value, const wchar_t *previousDataString)
{
	DWORD dwData = 0;
	
	BOOL returnFirst;
	BOOL rememberFirst;
	BOOL repeat;
	DWORD previousData = 0;
	if (previousDataString == NULL)				// Not specified: return the current value
	{
		returnFirst = TRUE;
		rememberFirst = FALSE;
		repeat = FALSE;
	}
	else if (wcslen(previousDataString) == 0)	// Empty: remember the current value, wait for change and return
	{
		returnFirst = FALSE;
		rememberFirst = TRUE;
		repeat = FALSE;
	}
	else if (!wcscmp(previousDataString, L"*"))	// *: display current and any changed values (does not return)
	{
		returnFirst = TRUE;
		rememberFirst = FALSE;
		repeat = TRUE;
	}
	else										// Specified: wait for change from this value and return
	{
		returnFirst = FALSE;
		rememberFirst = FALSE;
		repeat = FALSE;
		previousData = wcstoul(previousDataString, NULL, 0);
	}
	
	HKEY hMainKey = ExtractMainKeyPrefix(&key);
	if (hMainKey == NULL)
	{
		fwprintf(stderr, L"ERROR: Could not extract main key prefix: %ls\n", key);
		return (DWORD)-1;
	}

	HKEY hKey = NULL;
	LSTATUS lErrorCode = RegOpenKeyExW(hMainKey, key, 0, KEY_NOTIFY, &hKey);
	if (lErrorCode != ERROR_SUCCESS)
	{
		fwprintf(stderr, L"ERROR: RegOpenKeyEx() failed (%d): %ls\n", lErrorCode, key);
		return (DWORD)-1;
	}
	
	for (;;)
	{
		// Query current value
		DWORD dwFlags = RRF_RT_REG_DWORD;
		DWORD cbData = sizeof(dwData);
		lErrorCode = RegGetValueW(hMainKey, key, value, dwFlags, NULL, &dwData, &cbData);
		if (lErrorCode != ERROR_SUCCESS)
		{
			fwprintf(stderr, L"ERROR: RegGetValue() failed (%d): %ls\n", lErrorCode, key);
			RegCloseKey(hKey);
			return (DWORD)-1;
		}
		
		if (rememberFirst)
		{
			previousData = dwData;
			rememberFirst = FALSE;
		}
		
		if (returnFirst || dwData != previousData)
		{
			returnFirst = FALSE;
			fwprintf(stdout, L"%u\n", dwData);
			fflush(stdout);
			previousData = dwData;
			if (!repeat) break;
		}
		
		HANDLE hEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
		if (hEvent == NULL)
		{
			fwprintf(stderr, L"ERROR: CreateEvent() failed.\n");
			RegCloseKey(hKey);
			return (DWORD)-1;
		}

		DWORD dwFilter = REG_NOTIFY_CHANGE_LAST_SET | REG_NOTIFY_THREAD_AGNOSTIC;
		lErrorCode = RegNotifyChangeKeyValue(hKey, TRUE, dwFilter, hEvent, TRUE);
		if (lErrorCode != ERROR_SUCCESS)
		{
			fwprintf(stderr, L"ERROR: RegNotifyChangeKeyValue() failed (%d): %ls\n", lErrorCode, key);
			RegCloseKey(hKey);
			return (DWORD)-1;
		}

		if (WaitForSingleObject(hEvent, INFINITE) == WAIT_FAILED)
		{
			fwprintf(stderr, L"ERROR: WaitForSingleObject() failed (%d): %ls\n", GetLastError(), key);
			RegCloseKey(hKey);
			return (DWORD)-1;
		}

		CloseHandle(hEvent);
	}
	
	RegCloseKey(hKey);	
	return dwData;
}


int wmain(int argc, wchar_t *argv[], wchar_t *envp[])
{
	const wchar_t *key = NULL;
	const wchar_t *value = NULL;
	const wchar_t *data = NULL;
	
	if (argc > 1) key = argv[1];
	if (argc > 2) value = argv[2];
	if (argc > 3) data = argv[3];
	
	if (key == NULL)
	{
		fwprintf(stderr, L"ERROR: Key not specified.\n");
		return -1;
	}
	
	if (value == NULL)
	{
		fwprintf(stderr, L"ERROR: Value not specified.\n");
		return -1;
	}
	
	// Data:
	// - not specified: return current value
	// - empty: look at startup value, wait for change, then return
	// - *: output current value, then each value if it changes
	// - specified: wait for change that is different to specified value, then return
	
	DWORD returnValue = WaitForRegistryChangeDword(key, value, data);
	return (int)returnValue;
}
