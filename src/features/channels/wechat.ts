import { spawn, ChildProcess } from 'child_process';
import { BaseChannel, ChannelStatus } from './baseChannel';

let wechatProcess: ChildProcess | null = null;
let currentStatus: ChannelStatus = 'disconnected';

export const wechatChannel: BaseChannel = {
  type: 'wechat',
  name: '微信',

  getStatus(): ChannelStatus {
    return currentStatus;
  },

  async connect(): Promise<{ success: boolean; message: string }> {
    if (currentStatus === 'connected' || currentStatus === 'connecting') {
      return { success: true, message: 'Already connecting/connected' };
    }

    try {
      currentStatus = 'connecting';

      wechatProcess = spawn('npx', ['-y', '@tencent-weixin/openclaw-weixin-cli@latest', 'install'], {
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      wechatProcess.on('error', (err) => {
        currentStatus = 'error';
        console.error('WeChat channel error:', err);
      });

      wechatProcess.on('close', () => {
        currentStatus = 'disconnected';
        wechatProcess = null;
      });

      wechatProcess.stdout?.on('data', (data) => {
        console.log('WeChat:', data.toString());
      });

      wechatProcess.stderr?.on('data', (data) => {
        console.error('WeChat error:', data.toString());
      });

      currentStatus = 'connected';
      return { success: true, message: '微信连接已启动，请在终端查看二维码' };
    } catch (error) {
      currentStatus = 'error';
      return { success: false, message: String(error) };
    }
  },

  async disconnect(): Promise<{ success: boolean; message: string }> {
    if (!wechatProcess) {
      return { success: true, message: 'Not connected' };
    }

    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(wechatProcess.pid), '/f', '/t']);
      } else {
        wechatProcess.kill('SIGTERM');
      }
      wechatProcess = null;
      currentStatus = 'disconnected';
      return { success: true, message: 'Disconnected' };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  },

  async send(message: string): Promise<{ success: boolean; message: string }> {
    if (currentStatus !== 'connected') {
      return { success: false, message: 'Not connected' };
    }

    return { success: true, message: 'Message sent (placeholder)' };
  },
};