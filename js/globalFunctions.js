const fun = (() => {


    let source = {
        origin: '',
        params: '',
        retries: '',
    };


    const consoleRgb = (icon, message, verbose) => {

        if (!verbose) return;

        message = `%c ${message.replace(/^\s+|\s+$/gm, '')}`;
        const timestamp = (`%c ${new Date().toLocaleString()} | `);
        let iconType = ['%c Info: ', '%c Warning: ', '%c Error: '];
        let iconColor = '';

        switch (icon) {
            case 'info':
                iconType = iconType[0];
                iconColor = 'green';
                break;
            case 'warn':
                iconType = iconType[1];
                iconColor = 'blue';
                break;
            case 'error':
                iconType = iconType[2];
                iconColor = 'red';
                break;
            default:
                console.log('Style not implemented');
        }

        const iconBackground = `background: silver; color: ${iconColor}; border-radius: 5px`;

        console.log(timestamp + iconType + message, '', iconBackground, '');
    };


    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    const dateToIso = (date) => {
        // accepts dates formatted as:
        // mmm d, yyyy; mmm dd, yyyy; mmm dd, yy
        // m-d-yyyy; m-d-yy; mm-dd-yy
        // m/d/yyyy; m/d/yy; mm/dd/yy
        // if empty current date is used
        const res = (date) ? `${date} GMT` : new Date(); // fix 1 day offset
        const result = new Date(res).toISOString().slice(0, 19).replace('T', ' ');

        return result;
    };


    const fetchData = async(obj) => {
        //console.log(obj);
        // add switches to make configs more slim
        const timeout = obj.timeout || 10000;
        const retries = obj.retries || 5;
        const format = obj.format || 'text';
        const delay = obj.delay || 1000;

        // build parameters for fetch
        const url = new URL(obj.url);
        const options = (obj.options) ? obj.options[0] : { method: 'GET', };
        url.search = (obj.params) ? new URLSearchParams(obj.params) : '';

        const modOptions = (options) => {
            const controller = new AbortController();
            const signal = controller.signal;

            // signal must be aborted by controller
            options.signal = signal;
            options.controller = controller;
            return options;
        }

        // main handler for requests
        const fetchRetry = async(fetchUrl, fetchOptions, n) => {
            return Promise.race([

                (async() => {
                    const r = await fetch(fetchUrl, fetchOptions);
                    if (format === 'json') {
                        return r.json();
                    }
                    if (format === 'text') {
                        return r.text();
                    }
                })(),

                (async() => {
                    await sleep(timeout);
                    throw new Error('timeout');
                })(),

            ]).catch(async(err) => {

                // Abort previous request
                fetchOptions.controller.abort();

                if (n === 0) {
                    consoleRgb('error',
                        `Request to ${fetchUrl.origin} failed. The process gets 
                        aborted after ${retries} retries.`, 1);

                    return null;
                }

                source.origin = fetchUrl.origin;
                source.params = fetchUrl.search;
                source.retries = n - 1;

                await sleep(delay);
                await fetchRetry(fetchUrl, modOptions(options), n - 1);

            })
        };

        // add delay between runs and execute
        await sleep(delay);
        return fetchRetry(url, modOptions(options), retries);
    };


    const fetchChain = (obj) => {

        const iterateProps = Object.keys(obj.iterateValues);

        // Prepare Data-Objects and resolve dynamic vars
        const tempArray = obj.iterateValues[iterateProps[0]].map((item, index) => {
            const tempObject = JSON.parse(JSON.stringify(obj.fetchOptions)); // clone trick
            iterateProps.map((keyname) => {
                tempObject.params[keyname] = obj.iterateValues[keyname][index];
            });
            return tempObject;
        });

        // final return of results
        return tempArray;
    };


    const getSession = async(site) => {

        // supported sites are:
        // [community, store, support]
        let url, result;

        if (site === 'store') url = 'https://store.steampowered.com/';
        if (site === 'support') url = 'https://help.steampowered.com/';
        if (site === 'community') url = 'https://steamcommunity.com/';

        result = await fetchData({url: url, format: 'text'}, {});
        result = /g_sessionID\s=\s"(.*)";/g.exec(result);
        result = result[1] || 0;
        return result;
    };


    const objKeysToArr = (array, keyname) => {

        // ToDo: add multi-dimensional support
        // turns keyvalues of array objects into array
        const arr = [];
        const len = array.length;
        let i = 0;

        for (; i < len; i++) {
            arr.push(array[i][keyname]);
        }

        return arr;
    };

    const symDiff = (a1, a2) => {

        // used to find symmetric difference between arrays
        // [1,2] & [2,3] = [1,3]
        const result = [];

        for (let i = 0; i < a1.length; i++) {
            if (a2.indexOf(a1[i]) === -1) {
                result.push(a1[i]);
            }
        }
        for (let i = 0; i < a2.length; i++) {
            if (a1.indexOf(a2[i]) === -1) {
                result.push(a2[i]);
            }
        }

        return result;
    };

    const wipeObjByKeyVal = (base, match, keyname) => {

        // used to remove objects by key value from array
        // variable keys can be matched

        const mlen = match.length;
        const blen = base.length;
        let m = 0;
        let b = 0;
        const final = [];

        for (; m < mlen; m++) {
            b = 0;
            for (; b < blen; b++) {
                if (match[m] === base[b][keyname]) {
                    final.push(base[b]);
                    break;
                }
            }
        }

        return final;
    };

    const capFirstLetter = (string) => {

        // self-explaining function
        const str = string.charAt(0).toUpperCase() + string.slice(1);
        return str;
    };

    return {
        capFirstLetter,
        consoleRgb,
        dateToIso,
        fetchData,
        fetchChain,
        getSession,
        objKeysToArr,
        symDiff,
        wipeObjByKeyVal,
    };
})();